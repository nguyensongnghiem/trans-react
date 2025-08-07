// hooks/useMultiLoading.js
import { useEffect, useState } from "react";

function useMultiLoading(loadingStates) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra tất cả các trạng thái loading
    const allLoaded = loadingStates.every((state) => state === false);
    setIsLoading(!allLoaded);
  }, [loadingStates]);

  return isLoading;
}
export default useMultiLoading;