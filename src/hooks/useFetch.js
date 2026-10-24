import { useState, useEffect } from "react";
import { api } from "../api/baseUrl";

export function useFetch(endpoint) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(Boolean(endpoint));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!endpoint) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);

    api
      .get(`/${endpoint}`)
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch((err) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [endpoint]);

  return { data, loading, error };
}
