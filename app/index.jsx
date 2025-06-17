import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    if (!router.canGoBack()) {
      // Delay navigation until navigation is ready
      const timeout = setTimeout(() => {
        const isAdmin = true; // your condition
        const path = isAdmin ? "/(admin)/AdminHome" : "/(user)/UserHome";
        console.log("Redirecting to:", path);
        router.replace(path);
      }, 50); // slight delay to wait for router

      return () => clearTimeout(timeout);
    }
  }, []);

  console.log("Index.tsx rendered");
  return null;
}
