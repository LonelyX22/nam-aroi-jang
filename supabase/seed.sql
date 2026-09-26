insert into public.shop_settings (
  id, shop_name_th, shop_name_en, phone, open_time, close_time,
  delivery_fee, delivery_province, promptpay, force_closed
) values (
  1, 'น้ำอร่อยจัง', 'Nam Aroi Jang', '06-1564-0529', '08:00', '20:00',
  0, 'นครปฐม', '06-1564-0529', false
)
on conflict (id) do update set
  shop_name_th = excluded.shop_name_th,
  shop_name_en = excluded.shop_name_en,
  phone = excluded.phone,
  open_time = excluded.open_time,
  close_time = excluded.close_time,
  delivery_fee = excluded.delivery_fee,
  delivery_province = excluded.delivery_province,
  promptpay = excluded.promptpay;

insert into public.products (slug, name_th, name_en, price, calories, ingredients_th, ingredients_en, emoji, is_available, sort_order) values
('thai-tea','ชาไทย','Thai Milk Tea',30,180,array['ชาไทย','นม','นมข้นหวาน'],array['Thai tea','Milk','Condensed milk'],'🧋',true,1),
('green-tea','ชาเขียวนม','Matcha Milk Tea',30,170,array['ชาเขียว','นม','นมข้นหวาน'],array['Green tea','Milk','Condensed milk'],'🍵',true,2),
('cocoa','โกโก้','Cocoa',30,190,array['โกโก้','นม','นมข้นหวาน'],array['Cocoa','Milk','Condensed milk'],'🍫',true,3),
('pink-milk','นมชมพู','Pink Milk',30,160,array['นมสด','น้ำแดง'],array['Fresh milk','Red syrup'],'🥛',true,4),
('fresh-milk','นมสด','Fresh Milk',30,150,array['นมสด','น้ำเชื่อม'],array['Fresh milk','Syrup'],'🥛',true,5),
('strawberry-milk','สตรอว์เบอร์รีนมสด','Strawberry Milk',30,180,array['นมสด','สตรอว์เบอร์รี'],array['Fresh milk','Strawberry'],'🍓',true,6),
('strawberry-soda','สตรอว์เบอร์รีโซดา','Strawberry Soda',30,110,array['สตรอว์เบอร์รี','โซดา'],array['Strawberry','Soda'],'🍓',true,7),
('lychee-soda','ลิ้นจี่โซดา','Lychee Soda',30,100,array['ลิ้นจี่','โซดา'],array['Lychee','Soda'],'🫧',true,8),
('honey-lemon','น้ำผึ้งมะนาว','Honey Lemon',30,120,array['น้ำผึ้ง','มะนาว','น้ำ'],array['Honey','Lemon','Water'],'🍋',true,9),
('orange-soda','ส้มโซดา','Orange Soda',30,100,array['ส้ม','โซดา'],array['Orange','Soda'],'🍊',true,10)
on conflict (slug) do update set
  name_th=excluded.name_th, name_en=excluded.name_en, price=excluded.price,
  calories=excluded.calories, ingredients_th=excluded.ingredients_th,
  ingredients_en=excluded.ingredients_en, emoji=excluded.emoji,
  is_available=excluded.is_available, sort_order=excluded.sort_order;

insert into public.promotions (code, name_th, name_en, discount_type, fixed_item_price, start_time, end_time, is_active)
values ('MORNING25','โปรเช้า 25 บาท','Morning 25 Baht','fixed_price_per_item',25,'08:00','10:00',true)
on conflict (code) do update set
  name_th=excluded.name_th, name_en=excluded.name_en,
  discount_type=excluded.discount_type, fixed_item_price=excluded.fixed_item_price,
  start_time=excluded.start_time, end_time=excluded.end_time, is_active=excluded.is_active;
