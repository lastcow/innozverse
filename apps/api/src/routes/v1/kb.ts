import { FastifyInstance } from 'fastify';
import { pool } from '../../db';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  CreateKBCategoryRequest,
  UpdateKBCategoryRequest,
  ListKBCategoriesRequest,
  CreateKBArticleRequest,
  ImportKBArticleRequest,
  UpdateKBArticleRequest,
  ListKBArticlesRequest,
  createKBCategoryRequestSchema,
  updateKBCategoryRequestSchema,
  createKBArticleRequestSchema,
  importKBArticleRequestSchema,
  updateKBArticleRequestSchema,
  KBCategoryWithChildren,
} from '@innozverse/shared';

interface CategoryIdParams {
  id: string;
}

interface ArticleIdParams {
  id: string;
}

interface ArticleSlugParams {
  slug: string;
}

interface SearchQuery {
  q: string;
  page?: number;
  limit?: number;
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper function to build category tree
function buildCategoryTree(
  categories: KBCategoryWithChildren[],
  parentId: string | null = null
): KBCategoryWithChildren[] {
  return categories
    .filter((cat) => cat.parent_id === parentId)
    .map((cat) => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function kbRoutes(fastify: FastifyInstance) {
  // ==================== CATEGORIES ====================

  // List categories
  fastify.get<{ Querystring: ListKBCategoriesRequest }>(
    '/kb/categories',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { parent_id, include_children, include_article_count } = request.query;

        let query = `
          SELECT id, name, slug, description, parent_id, sort_order, icon, is_active,
                 created_at, updated_at
          FROM kb_categories
          WHERE is_active = true
        `;
        const params: (string | null)[] = [];

        if (parent_id !== undefined) {
          if (parent_id === 'null' || parent_id === '') {
            query += ` AND parent_id IS NULL`;
          } else {
            query += ` AND parent_id = $1`;
            params.push(parent_id);
          }
        }

        query += ` ORDER BY sort_order, name`;

        const result = await pool.query(query, params);
        let categories = result.rows as KBCategoryWithChildren[];

        // Add article count if requested
        if (include_article_count) {
          const countResult = await pool.query(`
            SELECT category_id, COUNT(*) as count
            FROM kb_articles
            WHERE status = 'published'
            GROUP BY category_id
          `);
          const countMap = new Map(
            countResult.rows.map((row) => [row.category_id, parseInt(row.count)])
          );
          categories = categories.map((cat) => ({
            ...cat,
            article_count: countMap.get(cat.id) || 0,
          }));
        }

        // Build tree if requested
        if (include_children) {
          categories = buildCategoryTree(categories);
        }

        return reply.send({
          status: 'ok',
          data: { categories },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch categories',
          statusCode: 500,
        });
      }
    }
  );

  // Get category by ID
  fastify.get<{ Params: CategoryIdParams }>(
    '/kb/categories/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { id } = request.params;

        const result = await pool.query(
          `SELECT id, name, slug, description, parent_id, sort_order, icon, is_active,
                  created_at, updated_at
           FROM kb_categories WHERE id = $1`,
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Category not found',
            statusCode: 404,
          });
        }

        const category = result.rows[0] as KBCategoryWithChildren;

        // Get children
        const childrenResult = await pool.query(
          `SELECT id, name, slug, description, parent_id, sort_order, icon, is_active,
                  created_at, updated_at
           FROM kb_categories WHERE parent_id = $1 AND is_active = true
           ORDER BY sort_order, name`,
          [id]
        );
        category.children = childrenResult.rows;

        // Get article count
        const countResult = await pool.query(
          `SELECT COUNT(*) FROM kb_articles WHERE category_id = $1 AND status = 'published'`,
          [id]
        );
        category.article_count = parseInt(countResult.rows[0].count);

        return reply.send({
          status: 'ok',
          data: { category },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch category',
          statusCode: 500,
        });
      }
    }
  );

  // Create category (admin only)
  fastify.post<{ Body: CreateKBCategoryRequest }>(
    '/kb/categories',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const validation = createKBCategoryRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const { name, slug, description, parent_id, sort_order, icon, is_active } =
          validation.data;

        // Generate slug if not provided
        const finalSlug = slug || generateSlug(name);

        // Validate parent exists if provided
        if (parent_id) {
          const parentResult = await pool.query(
            'SELECT id FROM kb_categories WHERE id = $1',
            [parent_id]
          );
          if (parentResult.rows.length === 0) {
            return reply.status(400).send({
              error: 'ValidationError',
              message: 'Parent category not found',
              statusCode: 400,
            });
          }
        }

        const result = await pool.query(
          `INSERT INTO kb_categories (name, slug, description, parent_id, sort_order, icon, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, name, slug, description, parent_id, sort_order, icon, is_active,
                     created_at, updated_at`,
          [
            name,
            finalSlug,
            description || null,
            parent_id || null,
            sort_order ?? 0,
            icon || null,
            is_active ?? true,
          ]
        );

        return reply.status(201).send({
          status: 'created',
          data: { category: result.rows[0] },
        });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof Error && error.message.includes('duplicate key')) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Category with this slug already exists',
            statusCode: 409,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create category',
          statusCode: 500,
        });
      }
    }
  );

  // Update category (admin only)
  fastify.put<{ Params: CategoryIdParams; Body: UpdateKBCategoryRequest }>(
    '/kb/categories/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;

        const validation = updateKBCategoryRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const data = validation.data;

        // Check for circular reference
        if (data.parent_id !== undefined && data.parent_id !== null) {
          if (data.parent_id === id) {
            return reply.status(400).send({
              error: 'ValidationError',
              message: 'Category cannot be its own parent',
              statusCode: 400,
            });
          }

          // Check if new parent is a descendant (would create a cycle)
          const checkCycleQuery = `
            WITH RECURSIVE descendants AS (
              SELECT id FROM kb_categories WHERE parent_id = $1
              UNION ALL
              SELECT c.id FROM kb_categories c
              INNER JOIN descendants d ON c.parent_id = d.id
            )
            SELECT id FROM descendants WHERE id = $2
          `;
          const cycleResult = await pool.query(checkCycleQuery, [id, data.parent_id]);
          if (cycleResult.rows.length > 0) {
            return reply.status(400).send({
              error: 'ValidationError',
              message: 'Cannot set parent to a descendant category',
              statusCode: 400,
            });
          }
        }

        // Build update query
        const updates: string[] = [];
        const params: (string | number | boolean | null)[] = [];
        let paramCount = 1;

        if (data.name !== undefined) {
          updates.push(`name = $${paramCount}`);
          params.push(data.name);
          paramCount++;
        }

        if (data.slug !== undefined) {
          updates.push(`slug = $${paramCount}`);
          params.push(data.slug);
          paramCount++;
        }

        if (data.description !== undefined) {
          updates.push(`description = $${paramCount}`);
          params.push(data.description);
          paramCount++;
        }

        if (data.parent_id !== undefined) {
          updates.push(`parent_id = $${paramCount}`);
          params.push(data.parent_id);
          paramCount++;
        }

        if (data.sort_order !== undefined) {
          updates.push(`sort_order = $${paramCount}`);
          params.push(data.sort_order);
          paramCount++;
        }

        if (data.icon !== undefined) {
          updates.push(`icon = $${paramCount}`);
          params.push(data.icon);
          paramCount++;
        }

        if (data.is_active !== undefined) {
          updates.push(`is_active = $${paramCount}`);
          params.push(data.is_active);
          paramCount++;
        }

        if (updates.length === 0) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'No fields to update',
            statusCode: 400,
          });
        }

        params.push(id);

        const query = `
          UPDATE kb_categories
          SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramCount}
          RETURNING id, name, slug, description, parent_id, sort_order, icon, is_active,
                    created_at, updated_at
        `;

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Category not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { category: result.rows[0] },
        });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof Error && error.message.includes('duplicate key')) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Category with this slug already exists',
            statusCode: 409,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update category',
          statusCode: 500,
        });
      }
    }
  );

  // Delete category (admin only)
  fastify.delete<{ Params: CategoryIdParams }>(
    '/kb/categories/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;

        // Check for articles in this category
        const articlesResult = await pool.query(
          'SELECT id FROM kb_articles WHERE category_id = $1 LIMIT 1',
          [id]
        );

        if (articlesResult.rows.length > 0) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Cannot delete category with articles. Move or delete articles first.',
            statusCode: 400,
          });
        }

        // Check for child categories
        const childrenResult = await pool.query(
          'SELECT id FROM kb_categories WHERE parent_id = $1 LIMIT 1',
          [id]
        );

        if (childrenResult.rows.length > 0) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Cannot delete category with sub-categories. Delete sub-categories first.',
            statusCode: 400,
          });
        }

        const result = await pool.query(
          'DELETE FROM kb_categories WHERE id = $1 RETURNING id',
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Category not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { message: 'Category deleted successfully' },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete category',
          statusCode: 500,
        });
      }
    }
  );

  // ==================== ARTICLES ====================

  // List articles with pagination
  fastify.get<{ Querystring: ListKBArticlesRequest }>(
    '/kb/articles',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { page = 1, limit = 20, category_id, status, search, is_featured, author_id } =
          request.query;
        const offset = (page - 1) * limit;

        const user = (request as any).user;
        const isAdmin = ['admin', 'super_user'].includes(user.role);

        // Build WHERE clause
        let whereClause = 'WHERE 1=1';
        const params: (string | number | boolean)[] = [];
        let paramCount = 1;

        // Non-admins only see published articles
        if (!isAdmin) {
          whereClause += ` AND a.status = 'published'`;
        } else if (status) {
          whereClause += ` AND a.status = $${paramCount}`;
          params.push(status);
          paramCount++;
        }

        if (category_id) {
          whereClause += ` AND a.category_id = $${paramCount}`;
          params.push(category_id);
          paramCount++;
        }

        if (is_featured !== undefined) {
          whereClause += ` AND a.is_featured = $${paramCount}`;
          params.push(is_featured);
          paramCount++;
        }

        if (author_id) {
          whereClause += ` AND a.author_id = $${paramCount}`;
          params.push(author_id);
          paramCount++;
        }

        if (search) {
          whereClause += ` AND (a.title ILIKE $${paramCount} OR a.summary ILIKE $${paramCount})`;
          params.push(`%${search}%`);
          paramCount++;
        }

        // Get total count
        const countQuery = `
          SELECT COUNT(*) FROM kb_articles a ${whereClause}
        `;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Build full query with JOINs
        const query = `
          SELECT a.id, a.category_id, a.title, a.slug, a.summary, a.status,
                 a.author_id, a.view_count, a.is_featured, a.published_at,
                 a.created_at, a.updated_at,
                 json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category,
                 CASE WHEN u.id IS NOT NULL
                   THEN json_build_object('id', u.id, 'name', u.name)
                   ELSE NULL
                 END as author
          FROM kb_articles a
          LEFT JOIN kb_categories c ON a.category_id = c.id
          LEFT JOIN users u ON a.author_id = u.id
          ${whereClause}
          ORDER BY a.is_featured DESC, a.published_at DESC NULLS LAST, a.created_at DESC
          LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        return reply.send({
          status: 'ok',
          data: {
            articles: result.rows,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch articles',
          statusCode: 500,
        });
      }
    }
  );

  // Full-text search articles
  fastify.get<{ Querystring: SearchQuery }>(
    '/kb/articles/search',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { q, page = 1, limit = 20 } = request.query;

        if (!q || q.trim().length < 2) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Search query must be at least 2 characters',
            statusCode: 400,
          });
        }

        const offset = (page - 1) * limit;

        // Count total matches (only published articles)
        const countResult = await pool.query(
          `SELECT COUNT(*) FROM kb_articles
           WHERE status = 'published'
           AND search_vector @@ plainto_tsquery('english', $1)`,
          [q]
        );
        const total = parseInt(countResult.rows[0].count);

        // Search with ranking
        const result = await pool.query(
          `SELECT
            a.id, a.category_id, a.title, a.slug, a.summary, a.status,
            a.author_id, a.view_count, a.is_featured, a.published_at,
            a.created_at, a.updated_at,
            json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category,
            CASE WHEN u.id IS NOT NULL
              THEN json_build_object('id', u.id, 'name', u.name)
              ELSE NULL
            END as author,
            ts_rank(a.search_vector, plainto_tsquery('english', $1)) as rank,
            ts_headline('english', COALESCE(a.summary, ''), plainto_tsquery('english', $1),
              'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=15'
            ) as highlighted_summary
           FROM kb_articles a
           LEFT JOIN kb_categories c ON a.category_id = c.id
           LEFT JOIN users u ON a.author_id = u.id
           WHERE a.status = 'published'
             AND a.search_vector @@ plainto_tsquery('english', $1)
           ORDER BY rank DESC, a.published_at DESC
           LIMIT $2 OFFSET $3`,
          [q, limit, offset]
        );

        return reply.send({
          status: 'ok',
          data: {
            articles: result.rows,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Search failed',
          statusCode: 500,
        });
      }
    }
  );

  // Get article by ID
  fastify.get<{ Params: ArticleIdParams }>(
    '/kb/articles/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const user = (request as any).user;
        const isAdmin = ['admin', 'super_user'].includes(user.role);

        let whereClause = 'WHERE a.id = $1';
        if (!isAdmin) {
          whereClause += ` AND a.status = 'published'`;
        }

        const result = await pool.query(
          `SELECT
            a.id, a.category_id, a.title, a.slug, a.summary, a.content, a.status,
            a.author_id, a.view_count, a.is_featured, a.published_at,
            a.created_at, a.updated_at,
            json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category,
            CASE WHEN u.id IS NOT NULL
              THEN json_build_object('id', u.id, 'name', u.name)
              ELSE NULL
            END as author
           FROM kb_articles a
           LEFT JOIN kb_categories c ON a.category_id = c.id
           LEFT JOIN users u ON a.author_id = u.id
           ${whereClause}`,
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Article not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { article: result.rows[0] },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch article',
          statusCode: 500,
        });
      }
    }
  );

  // Get article by slug
  fastify.get<{ Params: ArticleSlugParams }>(
    '/kb/articles/slug/:slug',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { slug } = request.params;
        const user = (request as any).user;
        const isAdmin = ['admin', 'super_user'].includes(user.role);

        let whereClause = 'WHERE a.slug = $1';
        if (!isAdmin) {
          whereClause += ` AND a.status = 'published'`;
        }

        const result = await pool.query(
          `SELECT
            a.id, a.category_id, a.title, a.slug, a.summary, a.content, a.status,
            a.author_id, a.view_count, a.is_featured, a.published_at,
            a.created_at, a.updated_at,
            json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category,
            CASE WHEN u.id IS NOT NULL
              THEN json_build_object('id', u.id, 'name', u.name)
              ELSE NULL
            END as author
           FROM kb_articles a
           LEFT JOIN kb_categories c ON a.category_id = c.id
           LEFT JOIN users u ON a.author_id = u.id
           ${whereClause}`,
          [slug]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Article not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { article: result.rows[0] },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch article',
          statusCode: 500,
        });
      }
    }
  );

  // Create article (admin only)
  fastify.post<{ Body: CreateKBArticleRequest }>(
    '/kb/articles',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const validation = createKBArticleRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const { category_id, title, slug, summary, content, status, is_featured } =
          validation.data;
        const user = (request as any).user;

        // Validate category exists
        const categoryResult = await pool.query(
          'SELECT id FROM kb_categories WHERE id = $1',
          [category_id]
        );
        if (categoryResult.rows.length === 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Category not found',
            statusCode: 400,
          });
        }

        const finalSlug = slug || generateSlug(title);
        const finalStatus = status || 'draft';
        const publishedAt = finalStatus === 'published' ? new Date().toISOString() : null;

        const result = await pool.query(
          `INSERT INTO kb_articles (category_id, title, slug, summary, content, status, author_id, is_featured, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id, category_id, title, slug, summary, content, status, author_id,
                     view_count, is_featured, published_at, created_at, updated_at`,
          [
            category_id,
            title,
            finalSlug,
            summary || null,
            content,
            finalStatus,
            user.userId,
            is_featured ?? false,
            publishedAt,
          ]
        );

        return reply.status(201).send({
          status: 'created',
          data: { article: result.rows[0] },
        });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof Error && error.message.includes('duplicate key')) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Article with this slug already exists',
            statusCode: 409,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create article',
          statusCode: 500,
        });
      }
    }
  );

  // Import article from markdown (admin only)
  fastify.post<{ Body: ImportKBArticleRequest }>(
    '/kb/articles/import',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const validation = importKBArticleRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const { category_id, title, slug, summary, content, status, is_featured } =
          validation.data;
        const user = (request as any).user;

        // Validate category exists
        const categoryResult = await pool.query(
          'SELECT id FROM kb_categories WHERE id = $1',
          [category_id]
        );
        if (categoryResult.rows.length === 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Category not found',
            statusCode: 400,
          });
        }

        const finalSlug = slug || generateSlug(title);
        const finalStatus = status || 'draft';
        const publishedAt = finalStatus === 'published' ? new Date().toISOString() : null;

        const result = await pool.query(
          `INSERT INTO kb_articles (category_id, title, slug, summary, content, status, author_id, is_featured, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id, category_id, title, slug, summary, content, status, author_id,
                     view_count, is_featured, published_at, created_at, updated_at`,
          [
            category_id,
            title,
            finalSlug,
            summary || null,
            content,
            finalStatus,
            user.userId,
            is_featured ?? false,
            publishedAt,
          ]
        );

        return reply.status(201).send({
          status: 'created',
          data: { article: result.rows[0] },
        });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof Error && error.message.includes('duplicate key')) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Article with this slug already exists',
            statusCode: 409,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to import article',
          statusCode: 500,
        });
      }
    }
  );

  // Update article (admin only)
  fastify.put<{ Params: ArticleIdParams; Body: UpdateKBArticleRequest }>(
    '/kb/articles/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;

        const validation = updateKBArticleRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: validation.error.errors[0].message,
            statusCode: 400,
          });
        }

        const data = validation.data;

        // Check if transitioning to published and need to set published_at
        let needsPublishedAt = false;
        if (data.status === 'published') {
          const currentResult = await pool.query(
            'SELECT status, published_at FROM kb_articles WHERE id = $1',
            [id]
          );
          if (currentResult.rows.length > 0) {
            const current = currentResult.rows[0];
            if (current.status !== 'published' && !current.published_at) {
              needsPublishedAt = true;
            }
          }
        }

        // Validate category exists if changing
        if (data.category_id) {
          const categoryResult = await pool.query(
            'SELECT id FROM kb_categories WHERE id = $1',
            [data.category_id]
          );
          if (categoryResult.rows.length === 0) {
            return reply.status(400).send({
              error: 'ValidationError',
              message: 'Category not found',
              statusCode: 400,
            });
          }
        }

        // Build update query
        const updates: string[] = [];
        const params: (string | boolean | null)[] = [];
        let paramCount = 1;

        if (data.category_id !== undefined) {
          updates.push(`category_id = $${paramCount}`);
          params.push(data.category_id);
          paramCount++;
        }

        if (data.title !== undefined) {
          updates.push(`title = $${paramCount}`);
          params.push(data.title);
          paramCount++;
        }

        if (data.slug !== undefined) {
          updates.push(`slug = $${paramCount}`);
          params.push(data.slug);
          paramCount++;
        }

        if (data.summary !== undefined) {
          updates.push(`summary = $${paramCount}`);
          params.push(data.summary);
          paramCount++;
        }

        if (data.content !== undefined) {
          updates.push(`content = $${paramCount}`);
          params.push(data.content);
          paramCount++;
        }

        if (data.status !== undefined) {
          updates.push(`status = $${paramCount}`);
          params.push(data.status);
          paramCount++;
        }

        if (data.is_featured !== undefined) {
          updates.push(`is_featured = $${paramCount}`);
          params.push(data.is_featured);
          paramCount++;
        }

        if (needsPublishedAt) {
          updates.push(`published_at = $${paramCount}`);
          params.push(new Date().toISOString());
          paramCount++;
        }

        if (updates.length === 0) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'No fields to update',
            statusCode: 400,
          });
        }

        params.push(id);

        const query = `
          UPDATE kb_articles
          SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramCount}
          RETURNING id, category_id, title, slug, summary, content, status, author_id,
                    view_count, is_featured, published_at, created_at, updated_at
        `;

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Article not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { article: result.rows[0] },
        });
      } catch (error: unknown) {
        request.log.error(error);
        if (error instanceof Error && error.message.includes('duplicate key')) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Article with this slug already exists',
            statusCode: 409,
          });
        }
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update article',
          statusCode: 500,
        });
      }
    }
  );

  // Delete article (admin only)
  fastify.delete<{ Params: ArticleIdParams }>(
    '/kb/articles/:id',
    { preHandler: [requireAuth, requireRole('admin', 'super_user')] },
    async (request, reply) => {
      try {
        const { id } = request.params;

        const result = await pool.query(
          'DELETE FROM kb_articles WHERE id = $1 RETURNING id',
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Article not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { message: 'Article deleted successfully' },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete article',
          statusCode: 500,
        });
      }
    }
  );

  // Increment view count
  fastify.post<{ Params: ArticleIdParams }>(
    '/kb/articles/:id/view',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const { id } = request.params;

        const result = await pool.query(
          'UPDATE kb_articles SET view_count = view_count + 1 WHERE id = $1 RETURNING view_count',
          [id]
        );

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'NotFound',
            message: 'Article not found',
            statusCode: 404,
          });
        }

        return reply.send({
          status: 'ok',
          data: { view_count: result.rows[0].view_count },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update view count',
          statusCode: 500,
        });
      }
    }
  );
}
