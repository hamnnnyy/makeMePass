-- 면접관·AI 지원자 음성(타입캐스트) 캐시. 같은 목소리·문장은 다시 합성하지 않는다.
-- 서버(service role)만 올리고, 누구나 공개 URL 로 재생한다 (면접 질문 음성이라 민감 정보 없음).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tts-cache', 'tts-cache', true, 2097152, array['audio/mpeg'])
on conflict (id) do nothing;
