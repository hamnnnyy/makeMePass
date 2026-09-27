-- 답변 녹음 저장용 비공개 버킷. 업로드는 서버(service role)가 하고,
-- 사용자는 경로 첫 폴더가 본인 user id 인 파일만 signed URL 로 읽는다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('session-audio', 'session-audio', false, 10485760, array['audio/wav'])
on conflict (id) do nothing;

create policy "own audio read" on storage.objects for select to authenticated
  using (bucket_id = 'session-audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
