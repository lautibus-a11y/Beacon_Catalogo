
import { supabase } from './supabase';
import { Product, Category, ProductImage } from './types';

// Datos de ejemplo para que la app se vea completa inmediatamente
const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'OFERTAS' },
  { id: 'cat-2', name: 'NUEVOS INGRESOS' },
  { id: 'cat-3', name: 'ELECTRÓNICA' },
  { id: 'cat-4', name: 'INDUMENTARIA' },
  { id: 'cat-5', name: 'ACCESORIOS' },
  { id: 'cat-6', name: 'HOGAR' }
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'AURICULARES NEXUS G1',
    price: 24900,
    description: 'Sonido de alta fidelidad con cancelación de ruido activa y 40 horas de batería. Diseño ergonómico de fibra de carbono.',
    categoryId: 'cat-3',
    isFeatured: true,
    createdAt: Date.now(),
    images: [
      { id: 'img-1-1', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000', order: 0 },
      { id: 'img-1-2', url: 'https://images.unsplash.com/photo-1583394838336-acd9929a5f9a?q=80&w=1000', order: 1 }
    ]
  },
  {
    id: 'prod-2',
    name: 'SMARTWATCH BEACON V2',
    price: 38500,
    description: 'Monitor de salud avanzado, GPS integrado y pantalla AMOLED de 1.9 pulgadas. Sumergible hasta 50 metros.',
    categoryId: 'cat-3',
    isFeatured: true,
    createdAt: Date.now() - 1000,
    images: [
      { id: 'img-2-1', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000', order: 0 },
      { id: 'img-2-2', url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=1000', order: 1 }
    ]
  },
  {
    id: 'prod-3',
    name: 'REMERA OVERSIZE URBANA',
    price: 12000,
    description: 'Algodón 100% premium de alto gramaje. Corte minimalista para un estilo callejero sofisticado.',
    categoryId: 'cat-4',
    isFeatured: false,
    createdAt: Date.now() - 2000,
    images: [
      { id: 'img-3-1', url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000', order: 0 }
    ]
  }
];

export const DB = {
  async getProducts(): Promise<Product[]> {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (*)
      `)
      .order('created_at', { ascending: false });

    if (error || !products || products.length === 0) {
      console.warn('Usando Mock Products (DB vacía o error)');
      return MOCK_PRODUCTS;
    }

    return products.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      description: p.description,
      categoryId: p.category_id,
      isFeatured: p.is_featured,
      createdAt: new Date(p.created_at).getTime(),
      images: (p.product_images || []).map((img: any) => ({
        id: img.id,
        url: img.image_url,
        order: img.sort_order
      })).sort((a: any, b: any) => a.order - b.order)
    }));
  },

  async saveProduct(product: Product): Promise<void> {
    // Si el ID es temporal (de frontend), dejamos que Supabase genere uno nuevo
    const isNew = product.id.startsWith('p_temp_');
    const productPayload = {
      name: product.name,
      price: product.price,
      description: product.description,
      category_id: product.categoryId,
      is_featured: product.isFeatured
    };

    let savedProduct;
    if (isNew) {
      const { data, error } = await supabase
        .from('products')
        .insert(productPayload)
        .select()
        .single();
      if (error) throw error;
      savedProduct = data;
    } else {
      const { data, error } = await supabase
        .from('products')
        .update(productPayload)
        .eq('id', product.id)
        .select()
        .single();
      if (error) throw error;
      savedProduct = data;
    }

    // Gestionar imágenes: Borramos actuales y re-insertamos para mantener el orden definido
    await supabase.from('product_images').delete().eq('product_id', savedProduct.id);

    if (product.images.length > 0) {
      const imagesToInsert = product.images.map((img, index) => ({
        product_id: savedProduct.id,
        image_url: img.url,
        sort_order: index
      }));
      const { error: imgError } = await supabase.from('product_images').insert(imagesToInsert);
      if (imgError) throw imgError;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error || !data || data.length === 0) {
      return MOCK_CATEGORIES;
    }
    return data;
  },

  async saveCategory(category: Category): Promise<void> {
    const isNew = category.id.startsWith('c_temp_');
    if (isNew) {
      const { error } = await supabase.from('categories').insert({ name: category.name });
      if (error) throw error;
    } else {
      const { error } = await supabase.from('categories').update({ name: category.name }).eq('id', category.id);
      if (error) throw error;
    }
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  }
};
