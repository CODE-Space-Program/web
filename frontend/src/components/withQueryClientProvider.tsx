import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const withQueryClientProvider = (Component: React.FC) => {
  return () => {
    const queryClient = new QueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <Component />
      </QueryClientProvider>
    );
  };
};
