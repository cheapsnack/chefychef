-- Smart Meal Planner — schema + seed
-- Generated from src/db/seed/recipes.ts by scripts/generate-migration.ts

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- groceries
-- ---------------------------------------------------------------------------
create table if not exists public.groceries (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category      text not null
                  constraint groceries_category_check
                  check (category in ('produce','dairy','meat','seafood','bakery','frozen','pantry','other')),
  quantity      numeric default 1,
  unit          text default 'pcs',
  purchase_date date not null default current_date,
  expiry_date   date not null,
  used          boolean not null default false,
  notes         text,
  created_at    timestamptz default now()
);

create index if not exists groceries_expiry_date_idx on public.groceries (expiry_date);

-- ---------------------------------------------------------------------------
-- recipes
-- ---------------------------------------------------------------------------
create table if not exists public.recipes (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  cuisine           text not null,
  prep_time_minutes integer not null,
  servings          integer not null default 2,
  instructions      text not null,
  ingredients       jsonb not null
);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- WARNING: These policies intentionally grant EVERY role (PUBLIC, which on
-- Supabase includes the anon and authenticated API roles) full
-- select/insert/update/delete access on every row. Smart Meal Planner v1 is a
-- SINGLE-USER DEMO with no authentication. This is NOT appropriate for a
-- production multi-tenant application — replace with per-user policies
-- (e.g. user_id = auth.uid()) before adding real accounts.
-- ---------------------------------------------------------------------------
alter table public.groceries enable row level security;
alter table public.recipes enable row level security;

drop policy if exists "public demo access to groceries" on public.groceries;
create policy "public demo access to groceries"
  on public.groceries for all
  to public
  using (true) with check (true);

drop policy if exists "public demo access to recipes" on public.recipes;
create policy "public demo access to recipes"
  on public.recipes for all
  to public
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Seed: 39 recipes across American, Italian, Asian, Indian,
-- Mediterranean and Mexican cuisines. Ingredient names use plain grocery
-- wording so client-side matching against grocery names works well.
-- ---------------------------------------------------------------------------
insert into public.recipes (name, cuisine, prep_time_minutes, servings, instructions, ingredients)
select * from (values
  ('Spinach & Egg Scramble', 'American', 10, 2, '1. Whisk eggs with a splash of milk, salt and pepper.
2. Melt butter in a nonstick pan over medium heat and wilt the spinach for 1 minute.
3. Pour in the eggs and stir gently until softly set.
4. Fold in cheese, let it melt, and serve immediately.', '[{"name":"spinach","quantity_text":"2 large handfuls","optional":false},{"name":"egg","quantity_text":"4","optional":false},{"name":"milk","quantity_text":"2 tbsp","optional":true},{"name":"cheese","quantity_text":"1/3 cup shredded","optional":false},{"name":"butter","quantity_text":"1 tbsp","optional":true}]'::jsonb),
  ('Classic Grilled Cheese', 'American', 10, 1, '1. Butter one side of each slice of bread.
2. Place cheese between the unbuttered sides.
3. Cook in a skillet over medium heat 3–4 minutes per side until golden and melted.
4. Add tomato slices inside if you like.', '[{"name":"bread","quantity_text":"2 slices","optional":false},{"name":"cheese","quantity_text":"2 slices","optional":false},{"name":"butter","quantity_text":"1 tbsp","optional":false},{"name":"tomato","quantity_text":"2 slices","optional":true}]'::jsonb),
  ('Buttermilk Pancakes', 'American', 20, 4, '1. Whisk flour, sugar, baking powder and a pinch of salt.
2. In another bowl, whisk milk, egg and melted butter.
3. Combine wet and dry until just mixed (lumps are fine).
4. Cook 1/4-cup portions on a buttered griddle until bubbles form, flip and finish.
5. Serve with banana slices.', '[{"name":"flour","quantity_text":"1 1/2 cups","optional":false},{"name":"milk","quantity_text":"1 1/4 cups","optional":false},{"name":"egg","quantity_text":"1","optional":false},{"name":"butter","quantity_text":"3 tbsp","optional":false},{"name":"sugar","quantity_text":"2 tbsp","optional":false},{"name":"banana","quantity_text":"1 sliced","optional":true}]'::jsonb),
  ('Chicken Caesar Salad', 'American', 25, 2, '1. Season chicken breast and pan-sear 6 minutes per side; rest and slice.
2. Tear lettuce into a bowl.
3. Whisk yogurt, lemon juice, garlic and parmesan into a dressing.
4. Toss lettuce with dressing, top with chicken and toasted bread cubes.', '[{"name":"chicken breast","quantity_text":"2","optional":false},{"name":"lettuce","quantity_text":"1 head","optional":false},{"name":"parmesan","quantity_text":"1/3 cup","optional":false},{"name":"bread","quantity_text":"2 slices, cubed","optional":false},{"name":"lemon","quantity_text":"1","optional":false},{"name":"garlic","quantity_text":"1 clove","optional":false},{"name":"yogurt","quantity_text":"1/4 cup","optional":true}]'::jsonb),
  ('Loaded Baked Potatoes', 'American', 60, 2, '1. Prick potatoes and bake at 200°C (400°F) for 50–60 minutes.
2. Fry bacon until crisp and crumble.
3. Split potatoes, fluff with a fork and add butter.
4. Top with cheese, bacon, sour cream and sliced green onion.', '[{"name":"potato","quantity_text":"2 large","optional":false},{"name":"cheese","quantity_text":"1/2 cup shredded","optional":false},{"name":"bacon","quantity_text":"3 strips","optional":false},{"name":"butter","quantity_text":"2 tbsp","optional":false},{"name":"sour cream","quantity_text":"1/4 cup","optional":true},{"name":"green onion","quantity_text":"2","optional":true}]'::jsonb),
  ('Turkey & Avocado Sandwich', 'American', 10, 1, '1. Toast the bread lightly.
2. Mash avocado with salt and spread on one slice.
3. Layer turkey, lettuce and tomato.
4. Add a little mayonnaise to the other slice, close and cut in half.', '[{"name":"bread","quantity_text":"2 slices","optional":false},{"name":"turkey","quantity_text":"4 slices","optional":false},{"name":"avocado","quantity_text":"1/2","optional":false},{"name":"lettuce","quantity_text":"2 leaves","optional":false},{"name":"tomato","quantity_text":"3 slices","optional":false},{"name":"mayonnaise","quantity_text":"1 tsp","optional":true}]'::jsonb),
  ('Spaghetti Carbonara', 'Italian', 20, 2, '1. Cook pasta in salted water until al dente; reserve a cup of pasta water.
2. Crisp diced bacon in a pan.
3. Whisk eggs with grated parmesan and black pepper.
4. Toss hot pasta with bacon off the heat, then stir in the egg mixture, loosening with pasta water until glossy.', '[{"name":"pasta","quantity_text":"200 g","optional":false},{"name":"egg","quantity_text":"2","optional":false},{"name":"bacon","quantity_text":"100 g","optional":false},{"name":"parmesan","quantity_text":"1/2 cup","optional":false},{"name":"garlic","quantity_text":"1 clove","optional":true}]'::jsonb),
  ('Margherita Pizza', 'Italian', 30, 2, '1. Preheat oven as hot as it goes with a tray inside.
2. Stretch dough, spread with crushed tomato and a pinch of salt.
3. Tear mozzarella over the top and drizzle with olive oil.
4. Bake 8–10 minutes, finish with fresh basil.', '[{"name":"pizza dough","quantity_text":"1 ball","optional":false},{"name":"tomato","quantity_text":"1 cup crushed","optional":false},{"name":"mozzarella","quantity_text":"125 g","optional":false},{"name":"basil","quantity_text":"handful","optional":false},{"name":"olive oil","quantity_text":"1 tbsp","optional":false}]'::jsonb),
  ('Tomato Basil Pasta', 'Italian', 20, 2, '1. Boil pasta until al dente.
2. Gently fry sliced garlic in olive oil, add halved cherry tomatoes and cook until they burst.
3. Toss with pasta, torn basil and parmesan.
4. Season generously.', '[{"name":"pasta","quantity_text":"200 g","optional":false},{"name":"tomato","quantity_text":"2 cups cherry","optional":false},{"name":"garlic","quantity_text":"3 cloves","optional":false},{"name":"basil","quantity_text":"handful","optional":false},{"name":"olive oil","quantity_text":"3 tbsp","optional":false},{"name":"parmesan","quantity_text":"1/4 cup","optional":true}]'::jsonb),
  ('Mushroom Risotto', 'Italian', 40, 3, '1. Sauté mushrooms in butter until browned; set aside.
2. Soften onion, add rice and toast for 1 minute.
3. Add warm stock a ladle at a time, stirring, until rice is creamy (about 18 minutes).
4. Stir in mushrooms, parmesan and a knob of butter.', '[{"name":"rice","quantity_text":"1 cup arborio","optional":false},{"name":"mushroom","quantity_text":"250 g","optional":false},{"name":"onion","quantity_text":"1","optional":false},{"name":"butter","quantity_text":"3 tbsp","optional":false},{"name":"parmesan","quantity_text":"1/2 cup","optional":false},{"name":"chicken stock","quantity_text":"4 cups","optional":false},{"name":"garlic","quantity_text":"1 clove","optional":true}]'::jsonb),
  ('Chicken Parmesan', 'Italian', 40, 2, '1. Pound chicken breasts thin, dip in beaten egg then breadcrumbs.
2. Pan-fry in olive oil until golden.
3. Top with tomato sauce and mozzarella, bake at 200°C until bubbling.
4. Serve over pasta.', '[{"name":"chicken breast","quantity_text":"2","optional":false},{"name":"egg","quantity_text":"1","optional":false},{"name":"breadcrumbs","quantity_text":"1 cup","optional":false},{"name":"tomato sauce","quantity_text":"1 cup","optional":false},{"name":"mozzarella","quantity_text":"100 g","optional":false},{"name":"pasta","quantity_text":"200 g","optional":true},{"name":"olive oil","quantity_text":"2 tbsp","optional":false}]'::jsonb),
  ('Caprese Salad', 'Italian', 10, 2, '1. Slice tomatoes and mozzarella.
2. Layer alternately on a plate with basil leaves.
3. Drizzle with olive oil and balsamic vinegar, season with salt and pepper.', '[{"name":"tomato","quantity_text":"2 large","optional":false},{"name":"mozzarella","quantity_text":"125 g","optional":false},{"name":"basil","quantity_text":"handful","optional":false},{"name":"olive oil","quantity_text":"2 tbsp","optional":false},{"name":"balsamic vinegar","quantity_text":"1 tbsp","optional":true}]'::jsonb),
  ('Zucchini Frittata', 'Italian', 25, 3, '1. Sauté sliced zucchini and onion in olive oil until soft.
2. Whisk eggs with parmesan, salt and pepper; pour over vegetables.
3. Cook on low until edges set, then finish under the grill until golden.', '[{"name":"egg","quantity_text":"6","optional":false},{"name":"zucchini","quantity_text":"2","optional":false},{"name":"onion","quantity_text":"1 small","optional":false},{"name":"parmesan","quantity_text":"1/3 cup","optional":false},{"name":"olive oil","quantity_text":"2 tbsp","optional":false},{"name":"milk","quantity_text":"2 tbsp","optional":true}]'::jsonb),
  ('Vegetable Fried Rice', 'Asian', 15, 2, '1. Scramble eggs in a hot wok and set aside.
2. Stir-fry garlic, carrot and peas for 2 minutes.
3. Add cold cooked rice and soy sauce, toss on high heat.
4. Return eggs, add green onion and serve.', '[{"name":"rice","quantity_text":"2 cups cooked","optional":false},{"name":"egg","quantity_text":"2","optional":false},{"name":"carrot","quantity_text":"1","optional":false},{"name":"peas","quantity_text":"1/2 cup","optional":false},{"name":"soy sauce","quantity_text":"2 tbsp","optional":false},{"name":"garlic","quantity_text":"2 cloves","optional":false},{"name":"green onion","quantity_text":"2","optional":true}]'::jsonb),
  ('Chicken Teriyaki Stir-Fry', 'Asian', 20, 2, '1. Slice chicken thinly and brown in a hot pan.
2. Add broccoli florets and a splash of water; cover 2 minutes.
3. Stir in soy sauce, honey, garlic and ginger; simmer until glossy.
4. Serve over steamed rice.', '[{"name":"chicken breast","quantity_text":"2","optional":false},{"name":"broccoli","quantity_text":"1 head","optional":false},{"name":"soy sauce","quantity_text":"3 tbsp","optional":false},{"name":"honey","quantity_text":"1 tbsp","optional":false},{"name":"garlic","quantity_text":"2 cloves","optional":false},{"name":"ginger","quantity_text":"1 tsp grated","optional":true},{"name":"rice","quantity_text":"1 cup","optional":true}]'::jsonb),
  ('Garlic Ginger Salmon', 'Asian', 20, 2, '1. Mix soy sauce, grated ginger, garlic and honey.
2. Marinate salmon 10 minutes.
3. Sear skin-side down 4 minutes, flip, brush with marinade and finish 3 minutes.
4. Serve with rice and green onion.', '[{"name":"salmon","quantity_text":"2 fillets","optional":false},{"name":"soy sauce","quantity_text":"2 tbsp","optional":false},{"name":"ginger","quantity_text":"1 tbsp","optional":false},{"name":"garlic","quantity_text":"2 cloves","optional":false},{"name":"honey","quantity_text":"1 tsp","optional":true},{"name":"rice","quantity_text":"1 cup","optional":true},{"name":"green onion","quantity_text":"1","optional":true}]'::jsonb),
  ('Tofu & Vegetable Stir-Fry', 'Asian', 20, 2, '1. Press and cube tofu; pan-fry until golden.
2. Stir-fry bell pepper, carrot and mushroom on high heat.
3. Add tofu, soy sauce and garlic; toss 1 minute.
4. Serve over rice or noodles.', '[{"name":"tofu","quantity_text":"300 g","optional":false},{"name":"bell pepper","quantity_text":"1","optional":false},{"name":"carrot","quantity_text":"1","optional":false},{"name":"mushroom","quantity_text":"150 g","optional":false},{"name":"soy sauce","quantity_text":"2 tbsp","optional":false},{"name":"garlic","quantity_text":"2 cloves","optional":false},{"name":"rice","quantity_text":"1 cup","optional":true}]'::jsonb),
  ('Egg Drop Soup', 'Asian', 15, 2, '1. Bring chicken stock to a simmer with ginger and soy sauce.
2. Slowly pour in beaten eggs while stirring to form ribbons.
3. Add sliced green onion and a few drops of sesame oil.', '[{"name":"egg","quantity_text":"2","optional":false},{"name":"chicken stock","quantity_text":"4 cups","optional":false},{"name":"green onion","quantity_text":"2","optional":false},{"name":"soy sauce","quantity_text":"1 tbsp","optional":false},{"name":"ginger","quantity_text":"1 tsp","optional":true},{"name":"sesame oil","quantity_text":"1 tsp","optional":true}]'::jsonb),
  ('Beef & Broccoli', 'Asian', 25, 2, '1. Slice beef thinly against the grain and toss with a little soy sauce.
2. Sear beef in batches, set aside.
3. Stir-fry broccoli and garlic, add a splash of water to steam.
4. Return beef, add soy sauce, ginger and a little sugar; toss until coated.', '[{"name":"beef","quantity_text":"300 g","optional":false},{"name":"broccoli","quantity_text":"1 head","optional":false},{"name":"soy sauce","quantity_text":"3 tbsp","optional":false},{"name":"garlic","quantity_text":"3 cloves","optional":false},{"name":"ginger","quantity_text":"1 tsp","optional":false},{"name":"sugar","quantity_text":"1 tsp","optional":true},{"name":"rice","quantity_text":"1 cup","optional":true}]'::jsonb),
  ('Shrimp Pad Thai', 'Asian', 30, 2, '1. Soak rice noodles in hot water until pliable.
2. Stir-fry shrimp and garlic, push aside, scramble eggs.
3. Add noodles, soy sauce, lime juice and sugar; toss.
4. Finish with bean sprouts, peanuts and green onion.', '[{"name":"shrimp","quantity_text":"200 g","optional":false},{"name":"rice noodles","quantity_text":"150 g","optional":false},{"name":"egg","quantity_text":"2","optional":false},{"name":"garlic","quantity_text":"2 cloves","optional":false},{"name":"lime","quantity_text":"1","optional":false},{"name":"soy sauce","quantity_text":"2 tbsp","optional":false},{"name":"peanuts","quantity_text":"1/4 cup","optional":true},{"name":"bean sprouts","quantity_text":"1 cup","optional":true}]'::jsonb),
  ('Chicken Tikka Masala', 'Indian', 40, 4, '1. Marinate chicken pieces in yogurt, garlic, ginger and garam masala for 15 minutes.
2. Sear the chicken and set aside.
3. Cook onion until golden, add crushed tomato and simmer 10 minutes.
4. Return chicken, stir in cream and simmer until cooked through. Serve with rice.', '[{"name":"chicken breast","quantity_text":"500 g","optional":false},{"name":"yogurt","quantity_text":"1/2 cup","optional":false},{"name":"tomato","quantity_text":"400 g crushed","optional":false},{"name":"onion","quantity_text":"1","optional":false},{"name":"garlic","quantity_text":"3 cloves","optional":false},{"name":"ginger","quantity_text":"1 tbsp","optional":false},{"name":"cream","quantity_text":"1/2 cup","optional":true},{"name":"rice","quantity_text":"1 cup","optional":true}]'::jsonb),
  ('Palak Paneer', 'Indian', 30, 3, '1. Blanch spinach, then blend to a purée.
2. Fry cubed paneer until golden; set aside.
3. Cook onion, garlic and ginger in butter until soft; add spices.
4. Stir in spinach purée and paneer, finish with a splash of cream.', '[{"name":"spinach","quantity_text":"400 g","optional":false},{"name":"paneer","quantity_text":"250 g","optional":false},{"name":"onion","quantity_text":"1","optional":false},{"name":"garlic","quantity_text":"3 cloves","optional":false},{"name":"ginger","quantity_text":"1 tbsp","optional":false},{"name":"butter","quantity_text":"2 tbsp","optional":false},{"name":"cream","quantity_text":"3 tbsp","optional":true}]'::jsonb),
  ('Chana Masala', 'Indian', 30, 4, '1. Fry onion until deeply golden, then add garlic, ginger and spices.
2. Add chopped tomato and cook down to a thick sauce.
3. Add drained chickpeas and a splash of water; simmer 10 minutes.
4. Finish with lemon juice and fresh cilantro.', '[{"name":"chickpeas","quantity_text":"2 cans","optional":false},{"name":"onion","quantity_text":"1 large","optional":false},{"name":"tomato","quantity_text":"2","optional":false},{"name":"garlic","quantity_text":"3 cloves","optional":false},{"name":"ginger","quantity_text":"1 tbsp","optional":false},{"name":"lemon","quantity_text":"1/2","optional":true},{"name":"cilantro","quantity_text":"handful","optional":true}]'::jsonb),
  ('Aloo Gobi', 'Indian', 35, 3, '1. Toast cumin seeds in oil, add onion and cook until soft.
2. Add cubed potato and cauliflower florets with turmeric and salt.
3. Cover and cook on low, stirring occasionally, until tender (20 minutes).
4. Add tomato and cilantro for the last 5 minutes.', '[{"name":"potato","quantity_text":"2","optional":false},{"name":"cauliflower","quantity_text":"1 head","optional":false},{"name":"onion","quantity_text":"1","optional":false},{"name":"tomato","quantity_text":"1","optional":false},{"name":"garlic","quantity_text":"2 cloves","optional":false},{"name":"ginger","quantity_text":"1 tsp","optional":true},{"name":"cilantro","quantity_text":"handful","optional":true}]'::jsonb),
  ('Red Lentil Dal', 'Indian', 30, 4, '1. Simmer lentils with turmeric in 3 cups of water until soft.
2. In a pan, fry onion, garlic and ginger in butter with cumin.
3. Stir the onion mixture and chopped tomato into the lentils.
4. Season, add lemon juice and serve with rice.', '[{"name":"red lentils","quantity_text":"1 cup","optional":false},{"name":"onion","quantity_text":"1","optional":false},{"name":"garlic","quantity_text":"3 cloves","optional":false},{"name":"ginger","quantity_text":"1 tbsp","optional":false},{"name":"tomato","quantity_text":"1","optional":false},{"name":"butter","quantity_text":"2 tbsp","optional":false},{"name":"lemon","quantity_text":"1/2","optional":true},{"name":"rice","quantity_text":"1 cup","optional":true}]'::jsonb),
  ('Vegetable Curry with Coconut Milk', 'Indian', 30, 4, '1. Soften onion and garlic, add curry powder and cook 1 minute.
2. Add diced potato, carrot and cauliflower with coconut milk.
3. Simmer 20 minutes until vegetables are tender.
4. Stir in spinach until wilted and serve with rice.', '[{"name":"coconut milk","quantity_text":"1 can","optional":false},{"name":"potato","quantity_text":"2","optional":false},{"name":"carrot","quantity_text":"2","optional":false},{"name":"cauliflower","quantity_text":"1/2 head","optional":false},{"name":"onion","quantity_text":"1","optional":false},{"name":"garlic","quantity_text":"2 cloves","optional":false},{"name":"spinach","quantity_text":"2 handfuls","optional":true},{"name":"rice","quantity_text":"1 cup","optional":true}]'::jsonb),
  ('Greek Salad', 'Mediterranean', 15, 2, '1. Chop cucumber, tomato and red onion into chunks.
2. Toss with olives and crumbled feta.
3. Dress with olive oil, lemon juice and dried oregano.', '[{"name":"cucumber","quantity_text":"1","optional":false},{"name":"tomato","quantity_text":"2","optional":false},{"name":"feta","quantity_text":"100 g","optional":false},{"name":"olives","quantity_text":"1/2 cup","optional":false},{"name":"onion","quantity_text":"1/2 red","optional":false},{"name":"olive oil","quantity_text":"3 tbsp","optional":false},{"name":"lemon","quantity_text":"1/2","optional":true}]'::jsonb),
  ('Hummus & Veggie Wraps', 'Mediterranean', 10, 2, '1. Spread hummus over each tortilla.
2. Layer cucumber, bell pepper, spinach and crumbled feta.
3. Roll tightly and slice in half.', '[{"name":"tortilla","quantity_text":"2 large","optional":false},{"name":"hummus","quantity_text":"1/2 cup","optional":false},{"name":"cucumber","quantity_text":"1/2","optional":false},{"name":"bell pepper","quantity_text":"1","optional":false},{"name":"spinach","quantity_text":"handful","optional":false},{"name":"feta","quantity_text":"50 g","optional":true}]'::jsonb),
  ('Lemon Garlic Roast Chicken', 'Mediterranean', 50, 4, '1. Toss chicken thighs and potato wedges with olive oil, garlic, lemon juice and oregano.
2. Roast at 220°C (425°F) for 40 minutes until golden.
3. Rest 5 minutes and serve with the pan juices.', '[{"name":"chicken thigh","quantity_text":"6","optional":false},{"name":"potato","quantity_text":"4","optional":false},{"name":"lemon","quantity_text":"2","optional":false},{"name":"garlic","quantity_text":"4 cloves","optional":false},{"name":"olive oil","quantity_text":"3 tbsp","optional":false},{"name":"onion","quantity_text":"1","optional":true}]'::jsonb),
  ('Shakshuka', 'Mediterranean', 25, 2, '1. Soften onion, bell pepper and garlic in olive oil with cumin and paprika.
2. Add crushed tomato and simmer 10 minutes.
3. Make wells and crack in the eggs; cover and cook until whites set.
4. Crumble feta on top and serve with bread.', '[{"name":"egg","quantity_text":"4","optional":false},{"name":"tomato","quantity_text":"400 g crushed","optional":false},{"name":"onion","quantity_text":"1","optional":false},{"name":"bell pepper","quantity_text":"1","optional":false},{"name":"garlic","quantity_text":"2 cloves","optional":false},{"name":"olive oil","quantity_text":"2 tbsp","optional":false},{"name":"feta","quantity_text":"50 g","optional":true},{"name":"bread","quantity_text":"for serving","optional":true}]'::jsonb),
  ('Mediterranean Baked Cod', 'Mediterranean', 25, 2, '1. Lay cod fillets in a baking dish with halved cherry tomatoes and olives.
2. Drizzle with olive oil, lemon juice and garlic.
3. Bake at 200°C (400°F) for 15 minutes until the fish flakes.', '[{"name":"cod","quantity_text":"2 fillets","optional":false},{"name":"tomato","quantity_text":"1 cup cherry","optional":false},{"name":"olives","quantity_text":"1/3 cup","optional":false},{"name":"lemon","quantity_text":"1","optional":false},{"name":"garlic","quantity_text":"2 cloves","optional":false},{"name":"olive oil","quantity_text":"2 tbsp","optional":false}]'::jsonb),
  ('Tzatziki Chicken Pita', 'Mediterranean', 25, 2, '1. Grate cucumber, squeeze dry and mix with yogurt, garlic and lemon for tzatziki.
2. Season and grill sliced chicken breast.
3. Warm pita and fill with chicken, tzatziki, tomato and lettuce.', '[{"name":"chicken breast","quantity_text":"2","optional":false},{"name":"pita bread","quantity_text":"2","optional":false},{"name":"yogurt","quantity_text":"1/2 cup","optional":false},{"name":"cucumber","quantity_text":"1/2","optional":false},{"name":"garlic","quantity_text":"1 clove","optional":false},{"name":"tomato","quantity_text":"1","optional":false},{"name":"lemon","quantity_text":"1/2","optional":true},{"name":"lettuce","quantity_text":"handful","optional":true}]'::jsonb),
  ('Chicken Quesadillas', 'Mexican', 20, 2, '1. Cook diced chicken with sliced bell pepper and onion until done.
2. Place a tortilla in a dry pan, add cheese and the chicken mixture, top with a second tortilla.
3. Cook until golden on both sides and the cheese melts. Serve with salsa and sour cream.', '[{"name":"tortilla","quantity_text":"4","optional":false},{"name":"chicken breast","quantity_text":"1","optional":false},{"name":"cheese","quantity_text":"1 cup shredded","optional":false},{"name":"bell pepper","quantity_text":"1","optional":false},{"name":"onion","quantity_text":"1/2","optional":false},{"name":"salsa","quantity_text":"for serving","optional":true},{"name":"sour cream","quantity_text":"for serving","optional":true}]'::jsonb),
  ('Black Bean Tacos', 'Mexican', 15, 2, '1. Warm black beans with cumin, garlic and a splash of water; mash lightly.
2. Warm tortillas.
3. Fill with beans, avocado, cheese, salsa and a squeeze of lime.', '[{"name":"black beans","quantity_text":"1 can","optional":false},{"name":"tortilla","quantity_text":"6 small","optional":false},{"name":"avocado","quantity_text":"1","optional":false},{"name":"cheese","quantity_text":"1/2 cup","optional":false},{"name":"lime","quantity_text":"1","optional":false},{"name":"garlic","quantity_text":"1 clove","optional":true},{"name":"salsa","quantity_text":"1/2 cup","optional":true}]'::jsonb),
  ('Beef Burrito Bowls', 'Mexican', 25, 2, '1. Brown ground beef with onion, garlic and taco seasoning.
2. Warm rice and black beans.
3. Assemble bowls with rice, beef, beans, tomato, cheese, avocado and lime.', '[{"name":"ground beef","quantity_text":"300 g","optional":false},{"name":"rice","quantity_text":"1 cup","optional":false},{"name":"black beans","quantity_text":"1 can","optional":false},{"name":"onion","quantity_text":"1/2","optional":false},{"name":"tomato","quantity_text":"1","optional":false},{"name":"cheese","quantity_text":"1/2 cup","optional":true},{"name":"avocado","quantity_text":"1","optional":true},{"name":"lime","quantity_text":"1","optional":true}]'::jsonb),
  ('Huevos Rancheros', 'Mexican', 20, 2, '1. Warm tortillas and spread with refried or mashed black beans.
2. Fry eggs sunny-side up.
3. Top tortillas with eggs, salsa, crumbled cheese, avocado and cilantro.', '[{"name":"egg","quantity_text":"4","optional":false},{"name":"tortilla","quantity_text":"4","optional":false},{"name":"black beans","quantity_text":"1 cup","optional":false},{"name":"salsa","quantity_text":"1/2 cup","optional":false},{"name":"cheese","quantity_text":"1/4 cup","optional":true},{"name":"avocado","quantity_text":"1/2","optional":true},{"name":"cilantro","quantity_text":"handful","optional":true}]'::jsonb),
  ('Guacamole & Chips', 'Mexican', 10, 4, '1. Mash avocados with lime juice and salt.
2. Fold in finely chopped onion, tomato and cilantro.
3. Serve immediately with tortilla chips.', '[{"name":"avocado","quantity_text":"3","optional":false},{"name":"lime","quantity_text":"1","optional":false},{"name":"onion","quantity_text":"1/4","optional":false},{"name":"tomato","quantity_text":"1","optional":false},{"name":"cilantro","quantity_text":"handful","optional":true},{"name":"tortilla chips","quantity_text":"1 bag","optional":false}]'::jsonb),
  ('Shrimp Fajitas', 'Mexican', 20, 2, '1. Toss shrimp with lime juice, garlic, cumin and paprika.
2. Sear sliced bell pepper and onion in a very hot pan; add shrimp and cook 3 minutes.
3. Serve in warm tortillas with sour cream and cilantro.', '[{"name":"shrimp","quantity_text":"300 g","optional":false},{"name":"bell pepper","quantity_text":"2","optional":false},{"name":"onion","quantity_text":"1","optional":false},{"name":"tortilla","quantity_text":"6","optional":false},{"name":"lime","quantity_text":"1","optional":false},{"name":"garlic","quantity_text":"2 cloves","optional":false},{"name":"sour cream","quantity_text":"for serving","optional":true},{"name":"cilantro","quantity_text":"handful","optional":true}]'::jsonb),
  ('Chicken Tortilla Soup', 'Mexican', 35, 4, '1. Soften onion and garlic, add crushed tomato and chicken stock; simmer 10 minutes.
2. Add shredded cooked chicken and corn; simmer 10 more minutes.
3. Serve topped with crushed tortilla chips, avocado, cheese and lime.', '[{"name":"chicken breast","quantity_text":"2","optional":false},{"name":"chicken stock","quantity_text":"4 cups","optional":false},{"name":"tomato","quantity_text":"400 g crushed","optional":false},{"name":"onion","quantity_text":"1","optional":false},{"name":"garlic","quantity_text":"2 cloves","optional":false},{"name":"corn","quantity_text":"1 cup","optional":false},{"name":"tortilla chips","quantity_text":"handful","optional":true},{"name":"avocado","quantity_text":"1","optional":true}]'::jsonb)
) as seed(name, cuisine, prep_time_minutes, servings, instructions, ingredients)
where not exists (select 1 from public.recipes);
