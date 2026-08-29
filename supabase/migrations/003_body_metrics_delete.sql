-- Allow users to delete their own body metrics (for reset)

drop policy if exists "body_metrics_delete_own" on public.body_metrics;
create policy "body_metrics_delete_own"
  on public.body_metrics for delete
  to authenticated
  using (auth.uid() = user_id);
