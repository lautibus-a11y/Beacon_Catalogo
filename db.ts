
import { supabase } from './supabase';
import { Product, Category, ProductImage } from './types';



export const DB = {
  async getProducts(): Promise<Product[]> {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    if (!products || products.length === 0) {
      return [];
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

      if (error) {
        console.error('Error inserting product:', error);
        throw new Error(error.message);
      }
      savedProduct = data;
    } else {
      const { data, error } = await supabase
        .from('products')
        .update(productPayload)
        .eq('id', product.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        throw new Error(error.message);
      }
      savedProduct = data;
    }

    if (!savedProduct) {
      throw new Error('No se pudo guardar el producto');
    }

    // Gestionar imágenes: Borramos actuales y re-insertamos para mantener el orden definido
    const { error: deleteError } = await supabase.from('product_images').delete().eq('product_id', savedProduct.id);
    if (deleteError) {
      console.error('Error deleting images:', deleteError);
      throw new Error(deleteError.message);
    }

    if (product.images.length > 0) {
      const imagesToInsert = product.images.map((img, index) => ({
        product_id: savedProduct.id,
        image_url: img.url,
        sort_order: index
      }));
      const { error: imgError } = await supabase.from('product_images').insert(imagesToInsert);
      if (imgError) {
        console.error('Error inserting images:', imgError);
        throw new Error(imgError.message);
      }
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Error deleting product:', error);
      throw new Error(error.message);
    }
  },

  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data;
  },

  async saveCategory(category: Category): Promise<void> {
    const isNew = category.id.startsWith('c_temp_');
    if (isNew) {
      const { error } = await supabase.from('categories').insert({ name: category.name });
      if (error) {
        console.error('Error inserting category:', error);
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabase.from('categories').update({ name: category.name }).eq('id', category.id);
      if (error) {
        console.error('Error updating category:', error);
        throw new Error(error.message);
      }
    }
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      console.error('Error deleting category:', error);
      throw new Error(error.message);
    }
  }
};
