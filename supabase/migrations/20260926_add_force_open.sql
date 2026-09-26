-- Add manual shop override modes.
-- AUTO:  force_open=false, force_closed=false
-- OPEN:  force_open=true,  force_closed=false
-- CLOSED: force_open=false, force_closed=true

alter table public.shop_settings
  add column if not exists force_open boolean not null default false;

update public.shop_settings
set force_open = false
where force_open is null;

create or replace function public.create_order(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.shop_settings%rowtype;
  v_customer public.customers%rowtype;
  v_product public.products%rowtype;
  v_promo public.promotions%rowtype;
  v_order_id uuid := gen_random_uuid();
  v_tracking uuid := gen_random_uuid();
  v_order_number text;
  v_phone text;
  v_name text;
  v_fulfillment text;
  v_payment text;
  v_delivery jsonb;
  v_note text;
  v_slip text;
  v_promo_id uuid;
  v_redeem boolean := false;
  v_item jsonb;
  v_items jsonb := '[]'::jsonb;
  v_qty integer;
  v_sweet integer;
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_delivery_fee numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_points_redeemed integer := 0;
  v_points_to_earn integer := 0;
  v_total_qty integer := 0;
  v_cheapest numeric(10,2) := null;
  v_now_time time := (timezone('Asia/Bangkok', now()))::time;
  v_now_date date := (timezone('Asia/Bangkok', now()))::date;
begin
  select * into v_settings from public.shop_settings where id = 1;
  if not found then raise exception 'Shop settings not found'; end if;
  if not v_settings.force_open
     and (v_settings.force_closed or v_now_time < v_settings.open_time or v_now_time >= v_settings.close_time) then
    raise exception 'ร้านปิดรับออเดอร์ในขณะนี้';
  end if;

  v_name := trim(coalesce(p_payload #>> '{customer,name}', ''));
  v_phone := regexp_replace(coalesce(p_payload #>> '{customer,phone}', ''), '\D', '', 'g');
  if length(v_name) < 1 or length(v_name) > 80 then raise exception 'ชื่อไม่ถูกต้อง'; end if;
  if v_phone !~ '^0[0-9]{9}$' then raise exception 'เบอร์โทรไม่ถูกต้อง'; end if;

  if (select count(*) from public.orders where customer_phone = v_phone and created_at > now() - interval '1 minute') >= 3 then
    raise exception 'ส่ง Order ถี่เกินไป กรุณารอสักครู่';
  end if;

  insert into public.customers (name, phone)
  values (v_name, v_phone)
  on conflict (phone) do update set name = excluded.name, updated_at = now()
  returning * into v_customer;

  v_fulfillment := coalesce(p_payload ->> 'fulfillment_type', '');
  if v_fulfillment not in ('pickup','delivery') then raise exception 'วิธีรับสินค้าไม่ถูกต้อง'; end if;
  v_delivery := p_payload -> 'delivery_address';
  if v_fulfillment = 'delivery' then
    if coalesce(v_delivery ->> 'house','') = '' or coalesce(v_delivery ->> 'subdistrict','') = '' or coalesce(v_delivery ->> 'district','') = '' or coalesce(v_delivery ->> 'postcode','') !~ '^[0-9]{5}$' then
      raise exception 'กรุณากรอกที่อยู่จัดส่งให้ครบ';
    end if;
    if lower(coalesce(v_delivery ->> 'province','')) <> lower(v_settings.delivery_province) then
      raise exception 'ร้านจัดส่งเฉพาะจังหวัด %', v_settings.delivery_province;
    end if;
    v_delivery_fee := v_settings.delivery_fee;
  end if;

  v_payment := coalesce(p_payload ->> 'payment_method', '');
  if v_payment not in ('cash','promptpay','bank_transfer','cash_on_delivery') then raise exception 'วิธีชำระเงินไม่ถูกต้อง'; end if;
  v_slip := nullif(p_payload ->> 'slip_path','');
  if v_payment in ('promptpay','bank_transfer') and v_slip is null then raise exception 'กรุณาแนบสลิป'; end if;
  v_note := left(coalesce(p_payload ->> 'note',''), 300);

  v_redeem := coalesce((p_payload ->> 'redeem_points')::boolean, false);
  if nullif(p_payload ->> 'promotion_id','') is not null then
    v_promo_id := (p_payload ->> 'promotion_id')::uuid;
  end if;
  if v_redeem and v_promo_id is not null then raise exception 'ใช้โปรโมชั่นและแลกแต้มพร้อมกันไม่ได้'; end if;

  if v_promo_id is not null then
    select * into v_promo from public.promotions where id = v_promo_id and is_active = true;
    if not found then raise exception 'โปรโมชั่นไม่พร้อมใช้งาน'; end if;
    if v_promo.start_date is not null and v_now_date < v_promo.start_date then raise exception 'โปรโมชั่นยังไม่เริ่ม'; end if;
    if v_promo.end_date is not null and v_now_date > v_promo.end_date then raise exception 'โปรโมชั่นหมดอายุ'; end if;
    if v_promo.start_time is not null and v_now_time < v_promo.start_time then raise exception 'ยังไม่ถึงเวลาโปรโมชั่น'; end if;
    if v_promo.end_time is not null and v_now_time >= v_promo.end_time then raise exception 'หมดเวลาโปรโมชั่นแล้ว'; end if;
  end if;

  if jsonb_typeof(p_payload -> 'items') <> 'array' or jsonb_array_length(p_payload -> 'items') = 0 then
    raise exception 'ไม่มีสินค้าใน Order';
  end if;

  for v_item in select value from jsonb_array_elements(p_payload -> 'items')
  loop
    v_qty := coalesce((v_item ->> 'quantity')::integer, 0);
    v_sweet := coalesce((v_item ->> 'sweetness')::integer, -1);
    if v_qty < 1 or v_qty > 20 then raise exception 'จำนวนสินค้าไม่ถูกต้อง'; end if;
    if v_sweet not in (0,25,50,75,100) then raise exception 'ระดับความหวานไม่ถูกต้อง'; end if;

    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid and is_available = true;
    if not found then raise exception 'มีเมนูที่ไม่พร้อมขาย'; end if;

    v_subtotal := v_subtotal + (v_product.price * v_qty);
    v_total_qty := v_total_qty + v_qty;
    if v_cheapest is null or v_product.price < v_cheapest then v_cheapest := v_product.price; end if;

    if v_promo_id is not null and v_promo.discount_type = 'fixed_price_per_item' then
      v_discount := v_discount + (greatest(v_product.price - v_promo.fixed_item_price, 0) * v_qty);
    end if;

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'product_name_th', v_product.name_th,
      'product_name_en', v_product.name_en,
      'unit_price', v_product.price,
      'quantity', v_qty,
      'sweetness', v_sweet
    ));
  end loop;

  if v_total_qty > 50 then raise exception 'จำนวนสินค้าเกินกำหนดต่อ Order'; end if;

  if v_redeem then
    if v_customer.points < 10 then raise exception 'แต้มไม่เพียงพอ'; end if;
    v_points_redeemed := 10;
    v_discount := coalesce(v_cheapest, 0);
    update public.customers set points = points - 10 where id = v_customer.id;
  end if;

  v_points_to_earn := greatest(v_total_qty - case when v_points_redeemed > 0 then 1 else 0 end, 0);
  v_total := greatest(v_subtotal - v_discount + v_delivery_fee, 0);
  v_order_number := 'NAJ-' || to_char(timezone('Asia/Bangkok', now()), 'YYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0');

  insert into public.orders (
    id, order_number, tracking_token, customer_id, customer_name, customer_phone,
    fulfillment_type, delivery_address, payment_method, payment_status, slip_path, note,
    status, subtotal, discount, delivery_fee, total, promotion_id,
    points_redeemed, points_to_earn
  ) values (
    v_order_id, v_order_number, v_tracking, v_customer.id, v_customer.name, v_customer.phone,
    v_fulfillment, case when v_fulfillment='delivery' then v_delivery else null end,
    v_payment, case when v_payment in ('promptpay','bank_transfer') then 'pending_review' else 'unpaid' end,
    v_slip, v_note, 'pending', v_subtotal, v_discount, v_delivery_fee, v_total, v_promo_id,
    v_points_redeemed, v_points_to_earn
  );

  for v_item in select value from jsonb_array_elements(v_items)
  loop
    insert into public.order_items (order_id, product_id, product_name_th, product_name_en, unit_price, quantity, sweetness)
    values (
      v_order_id,
      (v_item ->> 'product_id')::uuid,
      v_item ->> 'product_name_th',
      v_item ->> 'product_name_en',
      (v_item ->> 'unit_price')::numeric,
      (v_item ->> 'quantity')::integer,
      (v_item ->> 'sweetness')::integer
    );
  end loop;

  if v_points_redeemed > 0 then
    insert into public.point_transactions (customer_id, order_id, points_delta, transaction_type, reason)
    values (v_customer.id, v_order_id, -v_points_redeemed, 'redeem', 'แลกเครื่องดื่มฟรี 1 แก้ว');
  end if;

  return jsonb_build_object('order_number', v_order_number, 'tracking_token', v_tracking, 'total', v_total);
end;
$$;
