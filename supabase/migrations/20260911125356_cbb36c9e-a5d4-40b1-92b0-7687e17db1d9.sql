UPDATE public.recipes
SET region = COALESCE(region, cuisine)
WHERE region IS NULL
  AND cuisine IN ('American','Italian','Asian','Indian','Mediterranean','Mexican');

UPDATE public.recipes
SET difficulty = CASE
  WHEN prep_time_minutes < 20 THEN 'easy'
  WHEN prep_time_minutes <= 40 THEN 'medium'
  ELSE 'hard'
END
WHERE difficulty IS NULL;