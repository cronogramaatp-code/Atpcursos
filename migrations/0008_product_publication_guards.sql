-- Guard authoring of multi-PDF products at the SQLite/D1 boundary.
-- Additive; existing published products and purchased snapshots remain unchanged.
CREATE TRIGGER IF NOT EXISTS product_files_insert_draft_guard
BEFORE INSERT ON product_files
BEGIN
 SELECT RAISE(ABORT,'PDF files require draft product')
 WHERE COALESCE((SELECT status FROM products WHERE id=NEW.product_id),'')<>'draft';
 SELECT RAISE(ABORT,'PDF files limit 20')
 WHERE (SELECT COUNT(*) FROM product_files WHERE product_id=NEW.product_id)>=20;
 SELECT RAISE(ABORT,'PDF file size limit 50 MB')
 WHERE NEW.size_bytes<0 OR NEW.size_bytes>52428800;
 SELECT RAISE(ABORT,'PDF files total size limit 300 MB')
 WHERE (SELECT COALESCE(SUM(size_bytes),0) FROM product_files WHERE product_id=NEW.product_id)+NEW.size_bytes>314572800;
END;

CREATE TRIGGER IF NOT EXISTS product_files_update_draft_guard
BEFORE UPDATE ON product_files
BEGIN
 SELECT RAISE(ABORT,'PDF files immutable after publication')
 WHERE COALESCE((SELECT status FROM products WHERE id=OLD.product_id),'')<>'draft'
 OR COALESCE((SELECT status FROM products WHERE id=NEW.product_id),'')<>'draft'
 OR NEW.product_id<>OLD.product_id;
 SELECT RAISE(ABORT,'PDF file size limit 50 MB')
 WHERE NEW.size_bytes<0 OR NEW.size_bytes>52428800;
 SELECT RAISE(ABORT,'PDF files total size limit 300 MB')
 WHERE (SELECT COALESCE(SUM(size_bytes),0) FROM product_files WHERE product_id=OLD.product_id)
  - OLD.size_bytes + NEW.size_bytes >314572800;
END;

CREATE TRIGGER IF NOT EXISTS product_files_delete_draft_guard
BEFORE DELETE ON product_files
WHEN COALESCE((SELECT status FROM products WHERE id=OLD.product_id),'')<>'draft'
BEGIN
 SELECT RAISE(ABORT,'PDF files immutable after publication');
END;

CREATE TRIGGER IF NOT EXISTS product_publish_require_pdfs
BEFORE UPDATE OF status ON products
WHEN OLD.status='draft' AND NEW.status='published'
BEGIN
 SELECT RAISE(ABORT,'Cannot publish without PDF files')
 WHERE (SELECT COUNT(*) FROM product_files WHERE product_id=OLD.id) NOT BETWEEN 1 AND 20;
END;

CREATE TRIGGER IF NOT EXISTS product_publication_no_reopen
BEFORE UPDATE OF status ON products
WHEN OLD.status IN ('published','archived') AND NEW.status='draft'
BEGIN
 SELECT RAISE(ABORT,'Published products cannot become editable drafts');
END;
