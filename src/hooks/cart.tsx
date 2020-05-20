import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const response = await AsyncStorage.getItem('@GoMarketPlace');
      if (response) setProducts(JSON.parse(response));

      await AsyncStorage.clear();
    }
    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productExists = products.find(
        existentProduct => existentProduct.id === id,
      );
      const newProducts = productExists
        ? products.map(p =>
            p.id === id ? { ...p, quantity: p.quantity + 1 } : p,
          )
        : products;
      setProducts(newProducts);
      await AsyncStorage.setItem('@GoMarketPlace', JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productExists = products.find(
        existentProduct => existentProduct.id === id,
      );
      const newProducts = productExists
        ? products.map(p =>
            p.id === id ? { ...p, quantity: p.quantity - 1 } : p,
          )
        : products;
      const filterProducts = newProducts.filter(
        p => !(p.id === id && p.quantity === 0),
      );
      setProducts(filterProducts);
      await AsyncStorage.setItem('@GoMarketPlace', JSON.stringify(products));
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(
        existentProduct => existentProduct.id === product.id,
      );
      productExists
        ? increment(productExists.id)
        : setProducts([...products, { ...product, quantity: 1 }]);

      await AsyncStorage.setItem('@GoMarketPlace', JSON.stringify(products));
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
