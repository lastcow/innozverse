-- Migration: Create knowledge base tables
-- Description: Categories (hierarchical) and Articles with full-text search for knowledge base
-- Created: 2025-12-28

-- Create article status enum
DO $$ BEGIN
  CREATE TYPE article_status AS ENUM (
    'draft',
    'published',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create kb_categories table (self-referential for hierarchy)
CREATE TABLE IF NOT EXISTS kb_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES kb_categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  icon VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create kb_articles table
CREATE TABLE IF NOT EXISTS kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES kb_categories(id) ON DELETE RESTRICT,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  summary TEXT,
  content TEXT NOT NULL,
  status article_status NOT NULL DEFAULT 'draft',
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- Full-text search vector column
  search_vector TSVECTOR
);

-- Create indexes for kb_categories
CREATE INDEX IF NOT EXISTS idx_kb_categories_parent_id ON kb_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_kb_categories_slug ON kb_categories(slug);
CREATE INDEX IF NOT EXISTS idx_kb_categories_sort_order ON kb_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_kb_categories_is_active ON kb_categories(is_active);

-- Create indexes for kb_articles
CREATE INDEX IF NOT EXISTS idx_kb_articles_category_id ON kb_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_status ON kb_articles(status);
CREATE INDEX IF NOT EXISTS idx_kb_articles_slug ON kb_articles(slug);
CREATE INDEX IF NOT EXISTS idx_kb_articles_author_id ON kb_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published_at ON kb_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_kb_articles_is_featured ON kb_articles(is_featured);

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_kb_articles_search ON kb_articles USING GIN(search_vector);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION kb_articles_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search_vector
DROP TRIGGER IF EXISTS kb_articles_search_vector_trigger ON kb_articles;
CREATE TRIGGER kb_articles_search_vector_trigger
  BEFORE INSERT OR UPDATE ON kb_articles
  FOR EACH ROW
  EXECUTE FUNCTION kb_articles_search_vector_update();

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_kb_categories_updated_at ON kb_categories;
CREATE TRIGGER update_kb_categories_updated_at
  BEFORE UPDATE ON kb_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kb_articles_updated_at ON kb_articles;
CREATE TRIGGER update_kb_articles_updated_at
  BEFORE UPDATE ON kb_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE kb_categories IS 'Hierarchical categories for knowledge base articles';
COMMENT ON COLUMN kb_categories.parent_id IS 'Self-reference for nested category structure';
COMMENT ON COLUMN kb_categories.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN kb_categories.icon IS 'Icon name for UI display (e.g., lucide icon name)';

COMMENT ON TABLE kb_articles IS 'Knowledge base articles with markdown content and full-text search';
COMMENT ON COLUMN kb_articles.content IS 'Article content stored as Markdown';
COMMENT ON COLUMN kb_articles.search_vector IS 'Auto-generated tsvector for full-text search (title A, summary B, content C weights)';
COMMENT ON COLUMN kb_articles.category_id IS 'Required - every article must belong to a category';
