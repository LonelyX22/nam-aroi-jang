-- น้ำอร่อยจัง - Supabase schema
-- Run this once in Supabase SQL Editor on a fresh project.

create extension if not exists pgcrypto;

create sequence if not exists public.order_number_seq start 1;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  is_active boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_settings (
  id integer primary key default 1 check (id = 1),
  shop_name_th text not null default 'น้ำอร่อยจัง',
  shop_name_en text not null default 'Nam Aroi Jang',
  phone text not null default '06-1564-0529',
  open_time time not null default '08:00',
  close_time time not null default '20:00',
  force_closed boolean not null default false,
  force_open boolean not null default false,
  delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0),
  delivery_province text not null default 'นครปฐม',
  promptpay text not null default '06-1564-0529',
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_th text not null,
  name_en text not null,
  price numeric(10,2) not null check (price >= 0),
  calories integer not null default 0 check (calories >= 0),
  ingredients_th text[] not null default '{}',
  ingredients_en text[] not null default '{}',
  emoji text default '🥤',
  image_url text,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique check (phone ~ '^0[0-9]{9}$'),
  points integer not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name_th text not null,
  name_en text not null,
  discount_type text not null check (discount_type in ('fixed_price_per_item')),
  fixed_item_price numeric(10,2) check (fixed_item_price >= 0),
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  tracking_token uuid not null default gen_random_uuid() unique,
  customer_id uuid not null references public.customers(id),
  customer_name text not null,
  customer_phone text not null,
  fulfillment_type text not null check (fulfillment_type in ('pickup', 'delivery')),
  delivery_address jsonb,
  payment_method text not null check (payment_method in ('cash', 'promptpay', 'bank_transfer', 'cash_on_delivery')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending_review', 'paid', 'rejected')),
  slip_path text,
  note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'preparing', 'ready', 'delivering', 'completed', 'cancelled')),
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  discount numeric(10,2) not null default 0 check (discount >= 0),
  delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0),
  total numeric(10,2) not null default 0 check (total >= 0),
  promotion_id uuid references public.promotions(id) on delete set null,
  points_redeemed integer not null default 0 check (points_redeemed >= 0),
  points_to_earn integer not null default 0 check (points_to_earn >= 0),
  points_awarded boolean not null default false,
  points_refunded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_th text not null,
  product_name_en text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 20),
  sweetness integer not null check (sweetness in (0,25,50,75,100)),
  created_at timestamptz not null default now()
);

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  points_delta integer not null check (points_delta <> 0),
  transaction_type text not null check (transaction_type in ('earn', 'redeem', 'refund', 'admin_adjustment')),
  reason text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_customer_phone on public.orders(customer_phone);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_point_tx_customer on public.point_transactions(customer_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
drop trigger if exists trg_promotions_updated_at on public.promotions;
create trigger trg_promotions_updated_at before update on public.promotions for each row execute function public.set_updated_at();
drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
drop trigger if exists trg_shop_settings_updated_at on public.shop_settings;
create trigger trg_shop_settings_updated_at before update on public.shop_settings for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true and role in ('owner','staff')
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true and role = 'owner'
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role, is_active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email,''), '@', 1)),
    case when lower(coalesce(new.email,'')) = 'o5170797@gmail.com' then 'owner' else 'staff' end,
    case when lower(coalesce(new.email,'')) = 'o5170797@gmail.com' then true else false end
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

create or replace function public.get_customer_points(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer public.customers%rowtype;
begin
  if p_phone !~ '^0[0-9]{9}$' then
    raise exception 'Invalid phone number';
  end if;
  select * into v_customer from public.customers where phone = p_phone;
  if not found then
    return jsonb_build_object('found', false, 'points', 0);
  end if;
  return jsonb_build_object('found', true, 'name', v_customer.name, 'phone', v_customer.phone, 'points', v_customer.points);
end;
$$;

create or replace function public.get_order_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
begin
  begin
    select * into v_order from public.orders where tracking_token = p_token::uuid;
  exception when invalid_text_representation then
    return null;
  end;
  if not found then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', oi.id,
    'product_id', oi.product_id,
    'product_name_th', oi.product_name_th,
    'product_name_en', oi.product_name_en,
    'unit_price', oi.unit_price,
    'quantity', oi.quantity,
    'sweetness', oi.sweetness
  ) order by oi.created_at), '[]'::jsonb)
  into v_items from public.order_items oi where oi.order_id = v_order.id;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'tracking_token', v_order.tracking_token,
    'fulfillment_type', v_order.fulfillment_type,
    'payment_method', v_order.payment_method,
    'payment_status', v_order.payment_status,
    'status', v_order.status,
    'subtotal', v_order.subtotal,
    'discount', v_order.discount,
    'delivery_fee', v_order.delivery_fee,
    'total', v_order.total,
    'created_at', v_order.created_at,
    'updated_at', v_order.updated_at,
    'order_items', v_items
  );
end;
$$;

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

create or replace function public.handle_order_status_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status in ('completed','cancelled') and new.status <> old.status then
    raise exception 'Order ที่จบแล้วไม่สามารถเปลี่ยนสถานะได้';
  end if;

  if new.status = 'completed' and old.status <> 'completed' and new.points_awarded = false then
    if new.points_to_earn > 0 then
      update public.customers set points = points + new.points_to_earn where id = new.customer_id;
      insert into public.point_transactions (customer_id, order_id, points_delta, transaction_type, reason, created_by)
      values (new.customer_id, new.id, new.points_to_earn, 'earn', 'แต้มจาก Order ' || new.order_number, auth.uid());
    end if;
    new.points_awarded := true;
  end if;

  if new.status = 'cancelled' and old.status <> 'cancelled' and new.points_redeemed > 0 and new.points_refunded = false then
    update public.customers set points = points + new.points_redeemed where id = new.customer_id;
    insert into public.point_transactions (customer_id, order_id, points_delta, transaction_type, reason, created_by)
    values (new.customer_id, new.id, new.points_redeemed, 'refund', 'คืนแต้มจาก Order ที่ยกเลิก ' || new.order_number, auth.uid());
    new.points_refunded := true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_order_status_points on public.orders;
create trigger trg_order_status_points before update of status on public.orders for each row execute function public.handle_order_status_points();

create or replace function public.admin_adjust_points(p_customer_id uuid, p_delta integer, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer;
begin
  if not public.is_owner() then raise exception 'Permission denied'; end if;
  if p_delta = 0 then raise exception 'Points delta cannot be zero'; end if;
  if length(trim(coalesce(p_reason,''))) < 2 then raise exception 'Reason is required'; end if;
  update public.customers
  set points = points + p_delta
  where id = p_customer_id and points + p_delta >= 0
  returning points into v_points;
  if not found then raise exception 'Customer not found or points would become negative'; end if;
  insert into public.point_transactions (customer_id, points_delta, transaction_type, reason, created_by)
  values (p_customer_id, p_delta, 'admin_adjustment', left(trim(p_reason), 200), auth.uid());
  return jsonb_build_object('points', v_points);
end;
$$;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.shop_settings enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.point_transactions enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_owner());

drop policy if exists settings_public_read on public.shop_settings;
create policy settings_public_read on public.shop_settings for select to anon, authenticated using (true);
drop policy if exists settings_owner_update on public.shop_settings;
create policy settings_owner_update on public.shop_settings for update to authenticated using (public.is_owner()) with check (public.is_owner());

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select to anon, authenticated using (is_available = true or public.is_admin());
drop policy if exists products_owner_insert on public.products;
create policy products_owner_insert on public.products for insert to authenticated with check (public.is_owner());
drop policy if exists products_owner_update on public.products;
create policy products_owner_update on public.products for update to authenticated using (public.is_owner()) with check (public.is_owner());
drop policy if exists products_owner_delete on public.products;
create policy products_owner_delete on public.products for delete to authenticated using (public.is_owner());

drop policy if exists customers_admin_read on public.customers;
create policy customers_admin_read on public.customers for select to authenticated using (public.is_admin());

drop policy if exists promotions_public_read on public.promotions;
create policy promotions_public_read on public.promotions for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists promotions_owner_insert on public.promotions;
create policy promotions_owner_insert on public.promotions for insert to authenticated with check (public.is_owner());
drop policy if exists promotions_owner_update on public.promotions;
create policy promotions_owner_update on public.promotions for update to authenticated using (public.is_owner()) with check (public.is_owner());
drop policy if exists promotions_owner_delete on public.promotions;
create policy promotions_owner_delete on public.promotions for delete to authenticated using (public.is_owner());

drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read on public.orders for select to authenticated using (public.is_admin());
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_admin_read on public.order_items;
create policy order_items_admin_read on public.order_items for select to authenticated using (public.is_admin());

drop policy if exists points_admin_read on public.point_transactions;
create policy points_admin_read on public.point_transactions for select to authenticated using (public.is_admin());


-- Restrict direct Order mutations to status/payment fields only.
revoke insert, delete on public.orders from anon, authenticated;
revoke update on public.orders from anon, authenticated;
grant update (status, payment_status) on public.orders to authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;
revoke insert, update, delete on public.customers from anon, authenticated;
revoke insert, update, delete on public.point_transactions from anon, authenticated;

-- Storage bucket for payment slips: private, image-only, max 5 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-slips', 'payment-slips', false, 5242880, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists payment_slips_anon_insert on storage.objects;
create policy payment_slips_anon_insert on storage.objects for insert to anon, authenticated
with check (bucket_id = 'payment-slips' and (storage.foldername(name))[1] = 'pending');

drop policy if exists payment_slips_admin_read on storage.objects;
create policy payment_slips_admin_read on storage.objects for select to authenticated
using (bucket_id = 'payment-slips' and public.is_admin());

drop policy if exists payment_slips_owner_delete on storage.objects;
create policy payment_slips_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'payment-slips' and public.is_owner());


-- Public product image bucket. Only Owner can upload/delete; anyone may view product images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists product_images_owner_insert on storage.objects;
create policy product_images_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.is_owner());

drop policy if exists product_images_owner_update on storage.objects;
create policy product_images_owner_update on storage.objects for update to authenticated
using (bucket_id = 'product-images' and public.is_owner()) with check (bucket_id = 'product-images' and public.is_owner());

drop policy if exists product_images_owner_delete on storage.objects;
create policy product_images_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and public.is_owner());

-- Function permissions
revoke all on function public.create_order(jsonb) from public;
revoke all on function public.get_customer_points(text) from public;
revoke all on function public.get_order_by_token(text) from public;
revoke all on function public.admin_adjust_points(uuid, integer, text) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;
grant execute on function public.get_customer_points(text) to anon, authenticated;
grant execute on function public.get_order_by_token(text) to anon, authenticated;
grant execute on function public.admin_adjust_points(uuid, integer, text) to authenticated;

-- Realtime for admin order notifications.
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;
