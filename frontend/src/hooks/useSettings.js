import useApiData from "./useApiData";

export const DEFAULT_ROOM_TYPES = [
  { name: "Single", capacity: 1 },
  { name: "Double", capacity: 2 },
  { name: "Triple", capacity: 3 },
  { name: "Four Share", capacity: 4 },
];
export const ALL_PAYMENT_MODES = ["Cash", "UPI", "Card", "Bank Transfer"];

export default function useSettings() {
  const { data, loading, error, reload, setData } = useApiData("/api/settings");
  return {
    settings: data?.settings || null,
    roomTypes: data?.settings?.roomTypes || DEFAULT_ROOM_TYPES,
    paymentModes: data?.settings?.paymentModes || ALL_PAYMENT_MODES,
    loading,
    error,
    reload,
    setSettings: (settings) => setData({ settings }),
  };
}
