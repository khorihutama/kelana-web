import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, uploadDocument, type UploadInput } from './lib/api';
import type { DocumentRecord, DocumentType, LockRequest, MyTripTab, PaymentMethod } from './lib/types';

export const keys = {
  trips: (params: Record<string, string | undefined>) => ['trips', params] as const,
  trip: (slug: string) => ['trip', slug] as const,
  categories: ['categories'] as const,
  myTrips: (tab: MyTripTab) => ['mytrips', tab] as const,
  reservation: (id: string) => ['reservation', id] as const,
  payment: (id: string) => ['payment', id] as const,
  completeness: (id: string) => ['completeness', id] as const,
  me: ['me'] as const,
};

export function useTrips(params: { q?: string; category?: string } = {}) {
  return useQuery({
    queryKey: keys.trips(params as Record<string, string | undefined>),
    queryFn: () => api.trips(params),
    placeholderData: keepPreviousData,
  });
}

export function useTrip(slug: string) {
  return useQuery({ queryKey: keys.trip(slug), queryFn: () => api.trip(slug), enabled: Boolean(slug) });
}

export function useCategories() {
  return useQuery({ queryKey: keys.categories, queryFn: () => api.categories(), staleTime: 60_000 });
}

export function useMyTrips(tab: MyTripTab) {
  return useQuery({ queryKey: keys.myTrips(tab), queryFn: () => api.myTrips(tab) });
}

export function useReservation(id: string) {
  return useQuery({ queryKey: keys.reservation(id), queryFn: () => api.reservation(id), enabled: Boolean(id) });
}

export function usePayment(id: string, options: { refetchInterval?: number | false } = {}) {
  return useQuery({
    queryKey: keys.payment(id),
    queryFn: () => api.payment(id),
    enabled: Boolean(id),
    refetchInterval: options.refetchInterval ?? false,
  });
}

export function useCompleteness(reservationId: string) {
  return useQuery({
    queryKey: keys.completeness(reservationId),
    queryFn: () => api.documents(reservationId),
    enabled: Boolean(reservationId),
  });
}

export function useMe() {
  return useQuery({ queryKey: keys.me, queryFn: () => api.me(), staleTime: 30_000 });
}

export function useLockReservation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: LockRequest) => api.lockReservation(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['mytrips'] });
    },
  });
}

export function useCreatePayment() {
  return useMutation({
    mutationFn: ({ reservationId, method }: { reservationId: string; method: PaymentMethod }) =>
      api.createPayment(reservationId, method),
  });
}

export function useValidatePromo() {
  return useMutation({
    mutationFn: ({ code, subtotal }: { code: string; subtotal: number }) => api.validatePromo(code, subtotal),
  });
}

export function useUploadDocument() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadInput) => uploadDocument(input),
    onSuccess: (record: DocumentRecord) => {
      void client.invalidateQueries({ queryKey: keys.completeness(record.reservation_id) });
    },
  });
}

export function useDeleteDocument(reservationId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.completeness(reservationId) });
    },
  });
}

export function useCancelMyTrip() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelMyTrip(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['mytrips'] });
    },
  });
}

export function useCancelReservation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelReservation(id),
    onSuccess: (_data, id) => {
      void client.invalidateQueries({ queryKey: keys.reservation(id) });
      void client.invalidateQueries({ queryKey: ['mytrips'] });
    },
  });
}

export type { DocumentType };