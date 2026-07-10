# PLAN.md

## 서비스 한 줄 소개
매일 아침 할 일·일정·날씨를 한눈에 보여주고, 날씨에 맞는 생활 조언과 기상특보 기반 뉴스 한 줄을 함께 제공하는 개인용 아침 대시보드.

## 사용자
- 본인 전용 (1인 사용, 로그인 없음)
- 로컬 환경(`npm run dev`, 포트 3001)에서만 실행, 별도 배포 없음
- 일정 미리보기/링크가 동작하려면 형제 프로젝트 `mcp-calendar`(포트 3000)도 함께 `npm run dev`로 실행 중이어야 함

## 핵심 기능 3개

### 1. 오늘의 할 일 & 일정 미리보기
- 할 일(Todo): 체크박스로 완료 표시, 시간 없음, 이 앱에서 직접 CRUD 관리
- 일정(Schedule): 시간이 있는 이벤트는 이 앱에서 직접 관리하지 않고, 형제 프로젝트 `mcp-calendar`(포트 3000)가 이미 관리하는 데이터를 그대로 사용. 이 앱(포트 3001)은 서버에서 mcp-calendar의 `/api/events`를 호출해 오늘 일정을 읽기 전용으로 미리보기만 하고, 클릭하면 mcp-calendar 앱으로 이동(새 탭)
- 두 앱을 함께 `npm run dev`로 띄워야 일정 미리보기가 동작함

### 2. 위치 기반 날씨 & 생활 조언
- 위치 검색 후 저장 (Open-Meteo Geocoding API, 키 불필요)
- 저장된 위치 기준 현재 날씨 + 오늘 최고/최저 (Open-Meteo Forecast API, 키 불필요)
- 날씨 조건(습도/강수/기온/풍속/자외선/미세먼지 등) 기반 생활 조언 규칙 19개 적용, 해당하는 조언 전부 표시
  - 예: 습도 75%↑ → 손수건, 강수확률 70%↑ → 장화, 풍속 8m/s↑ → 머리 묶기, 눈 예보 → 크리스마스 영화 추천 등

### 3. 오늘의 날씨 뉴스 한 줄
- 기상청 특보(종합) 페이지가 로딩하는 내부 AJAX 조각 엔드포인트(`weather.go.kr/w/wnuri-fct2021/weather/warning.do`, `X-Requested-With`/`Referer` 헤더 필요)를 서버 사이드에서 `fetch` + cheerio로 파싱 (실제 페이지 본문은 클라이언트 JS로 채워지지만, 이 내부 엔드포인트 자체는 순수 HTML을 반환하므로 브라우저 자동화 불필요 — 확인 완료)
- "날씨해설" 섹션의 따옴표 헤드라인(`strong.txt-subtitle`)과 본문(`.cmp-weather-cmt-txt-box-inner`) 추출
- 쉬운 말로 바꾼 한 줄 요약 표시 (전문 용어 → 일상어)
  - 현재는 API 키 없어 목업 처리, 추후 Anthropic API 연동 시 실제 LLM 요약으로 교체 예정

## 데이터 모델 (테이블 초안)

### todos
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | integer, PK | |
| date | text (YYYY-MM-DD) | 해당 날짜 |
| content | text | 할 일 내용 |
| done | boolean | 완료 여부 |
| createdAt | text (ISO datetime) | |

(일정/schedules 테이블은 없음 — 일정은 mcp-calendar의 sqlite.db가 소유하며, 이 앱은 그쪽 `/api/events`를 호출만 한다.)

### user_location
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | integer, PK | 단일 행(row) 설정 테이블 |
| name | text | 지역 이름 |
| latitude | real | |
| longitude | real | |
| updatedAt | text (ISO datetime) | |

### weather_news_cache
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | integer, PK | |
| date | text (YYYY-MM-DD) | |
| rawHeadline | text | 기상청 원문 헤드라인 |
| plainSummary | text | 쉬운 말 요약 (현재는 목업) |
| sourceUrl | text | 스크래핑 출처 URL |
| fetchedAt | text (ISO datetime) | |

## API 엔드포인트 초안

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/todos?date=` | 해당 날짜의 할 일 목록 조회 |
| POST | `/api/todos` | 할 일 추가 |
| PATCH | `/api/todos/:id` | 완료 토글/내용 수정 |
| DELETE | `/api/todos/:id` | 할 일 삭제 |
| GET | `/api/location` | 저장된 위치 조회 |
| PUT | `/api/location` | 위치 저장/변경 |
| GET | `/api/location/search?q=` | 위치 검색 (지오코딩 프록시) |
| GET | `/api/weather?date=` | 저장된 위치 기준 날씨 + 조언 목록 반환 |
| GET | `/api/weather-news?date=` | 오늘의 날씨 뉴스 한 줄 (캐시 우선, 없으면 스크래핑) |
| GET | `/api/schedule-preview?date=` | mcp-calendar의 오늘 일정을 미리보기로 반환 (mcp-calendar가 꺼져있으면 `{available:false}`) |

## MCP tool 3개

| name | description |
|---|---|
| `todo_create` | 지정한 날짜(기본값: 오늘)에 새로운 할 일을 추가한다. Next.js `/api/todos` 엔드포인트를 호출한다. |
| `location_set` | 날씨/조언 조회에 사용할 위치(이름, 위도, 경도)를 저장한다. Next.js `/api/location` 엔드포인트를 호출한다. |
| `today_briefing_get` | 오늘 날짜 기준 할 일, 날씨, 생활 조언, 날씨 뉴스 한 줄, 일정 미리보기를 한 번에 조회해 종합 브리핑으로 반환한다. 일정 자체의 CRUD는 mcp-calendar가 이미 제공하는 `event_create`/`event_delete`/`event_list` MCP 툴을 그대로 사용한다. |
