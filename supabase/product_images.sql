-- ============================================
-- FOTOS DE PRODUCTOS (ejecutar en SQL Editor)
-- ============================================

-- Bucket público para imágenes de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Cualquiera puede ver las imágenes
DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
CREATE POLICY "Product images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Solo usuarios autenticados suben, en la carpeta de SU comercio
DROP POLICY IF EXISTS "Product images upload" ON storage.objects;
CREATE POLICY "Product images upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = public.get_user_business_id()
  );

DROP POLICY IF EXISTS "Product images update" ON storage.objects;
CREATE POLICY "Product images update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = public.get_user_business_id()
  );

DROP POLICY IF EXISTS "Product images delete" ON storage.objects;
CREATE POLICY "Product images delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = public.get_user_business_id()
  );
