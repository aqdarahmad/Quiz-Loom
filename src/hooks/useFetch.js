import { useState, useEffect } from "react";
import { api } from "../api/baseUrl";
export function useFetch(endpoint) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    if(!endpoint) return;
    const fetchData = async () => {
      try {
       const res = await api.get(`/${endpoint}`);
        setData(res.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}
