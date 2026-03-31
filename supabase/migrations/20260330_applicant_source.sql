-- warroom_applicants에 source 컬럼 추가
-- 'apply' = 지원자가 직접 지원, 'invite' = 팀장 초대 수락
alter table warroom_applicants
  add column if not exists source text not null default 'apply';
