import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useToast } from '../components/Toast'

/** Shared by the meetings list and the detail page, which both delete meetings. */
export function useDeleteMeeting(onDeleted?: () => void) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (id: number) => api.deleteMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries()
      toast('Meeting deleted')
      onDeleted?.()
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })
}
