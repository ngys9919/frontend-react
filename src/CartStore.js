import { atom, useAtom } from 'jotai';
import axios from 'axios';
import Immutable from "seamless-immutable";
import { useEffect } from "react";
import { useJwt } from "./UserStore";

// Define the initial state of the cart. We put in one piece of test data
// const initialCart = Immutable([
// {
//     "id": 1,
//     "product_id": 1,
//     "quantity": 10,
//     "productName": "Organic Green Tea",
//     "price": 12.99,
//     "imageUrl": "https://picsum.photos/id/225/300/200",
//     "description": "Premium organic green tea leaves, rich in antioxidants and offering a smooth, refreshing taste."
//   },
// ]);

// Define the initial state of the cart.
const initialCart = Immutable([
  // testing data removed
]);

// const initialCart = Immutable([]);

export const cartAtom = atom(initialCart);
export const cartLoadingAtom = atom(false);

// Custom hook for cart operations
export const useCart = () => {
  const [cart, setCart] = useAtom(cartAtom);
  const [isLoading, setIsLoading] = useAtom(cartLoadingAtom);
  const { getJwt } = useJwt();

  const updateCart = async () => {
      const jwt = getJwt();
      setIsLoading(true);
      try {
          const updatedCartItems = cart.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
          }));
          await axios.put(
              `${import.meta.env.VITE_API_URL}/api/cart`,
              { cartItems: updatedCartItems },
              {
                  headers: {
                      Authorization: `Bearer ${jwt}`,
                  },
              }
          );
      } catch (error) {
          console.error("Error updating cart:", error);
      } finally {
          setIsLoading(false);
      }
  };

  // Update cart on the backend whenever the cart changes
  useEffect(() => {
      if (cart !== initialCart) {
          updateCart();
      }
  }, [cart]); // Depend on the cart state

  const modifyCart = (product_id, quantity) => {
      setCart((currentCart) => {
          const existingItemIndex = currentCart.findIndex(
              (item) => item.product_id === product_id
          );
          if (existingItemIndex !== -1) {
              if (quantity >= 1) {
                  return currentCart.setIn(
                      [existingItemIndex, "quantity"],
                      quantity
                  );
              } else {
                  return currentCart.filter(
                      (item) => item.product_id !== product_id
                  );
              }
          }
          return currentCart;
      });
  };

  const addToCart = (product) => {
      setCart((currentCart) => {
          const existingItemIndex = currentCart.findIndex(
              (item) => item.product_id === product.id
          );
          if (existingItemIndex !== -1) {
              return currentCart.setIn(
                  [existingItemIndex, "quantity"],
                  currentCart[existingItemIndex].quantity + 1
              );
          } else {
              const newCartItem = {
                  ...product,
                  product_id: product.id,
                  id: Math.floor(Math.random() * 10000 + 1),
                  quantity: 1,
              };
              return currentCart.concat(newCartItem);
          }
      });
  };

  const deleteCartItem = (product_id) => {
      setCart((currentCart) =>
          currentCart.filter((item) => item.product_id !== product_id)
      );
  };

  const fetchCart = async () => {
      const jwt = getJwt();
      setIsLoading(true);
      try {
          const response = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/cart`,
              {
                  headers: {
                      Authorization: `Bearer ${jwt}`,
                  },
              }
          );
          setCart(Immutable(response.data));
      } catch (error) {
          console.error("Error fetching cart:", error);
      } finally {
          setIsLoading(false);
      }
  };

 
  const getCartTotal = () =>
      cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const getCart = () => cart;

  return {
      getCart,
      getCartTotal,
      addToCart,
      modifyCart,
      deleteCartItem,
      fetchCart,
      isLoading,
  };
};

