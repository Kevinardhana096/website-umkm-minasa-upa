-- Storage hardening untuk project Supabase yang sudah berjalan.
-- Run after schema.sql. File baru dibatasi maksimal 5 MB dan hanya format gambar web.

update storage.buckets
set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'product-images';
