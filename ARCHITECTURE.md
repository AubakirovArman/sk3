# SK AI (SKAI) - Архитектура системы

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    FRONT END                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   /dialog    │  │/virtual-dir. │  │     /np      │  │     /vnd     │          │
│  │   (Chat UI)  │  │ (Doc Analysis│  │  (NP Panel)  │  │ (VND Panel)  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                  │                   │
│         └─────────────────┴──────────────────┴──────────────────┘                   │
│                                    │                                                 │
│                              Next.js 15 App Router                                  │
│                              React 18 + TypeScript                                  │
└─────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    BACK END                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                            API Routes (Next.js)                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│  │  │/api/dialog/ │  │/api/analyze/│  │  /api/np/   │  │  /api/vnd/  │        │  │
│  │  │   chat      │  │             │  │   route     │  │   route     │        │  │
│  │  └─────┬───────┘  └─────┬───────┘  └─────┬───────┘  └─────┬───────┘        │  │
│  │        │                │                │                │                  │  │
│  │        │  ┌─────────────┴────────────────┴────────────────┘                 │  │
│  │        │  │                                                                  │  │
│  │        ▼  ▼                                                                  │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐       │  │
│  │  │              System Prompt Builder                                │       │  │
│  │  │  • buildSystemPrompt(language, hasContext)                       │       │  │
│  │  │  • buildSystemPromptWithKnowledge(meetings, faqContext)          │       │  │
│  │  │  • Эталонные примеры ответов                                     │       │  │
│  │  │  • Правила форматирования (no markdown)                          │       │  │
│  │  └──────────────────────────┬───────────────────────────────────────┘       │  │
│  │                             │                                                │  │
│  │                             ▼                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐       │  │
│  │  │              FAQ Matching Engine                                  │       │  │
│  │  │  • findRelevantFAQ(userQuestion, language)                       │       │  │
│  │  │  • Точное совпадение                                              │       │  │
│  │  │  • Частичное совпадение (>70% слов)                              │       │  │
│  │  │  • Поиск в similarQuestions                                       │       │  │
│  │  └──────────────────────────┬───────────────────────────────────────┘       │  │
│  │                             │                                                │  │
│  │                             ▼                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐       │  │
│  │  │            Knowledge Context Builder                              │       │  │
│  │  │  • buildKnowledgeContext(meetings, language)                     │       │  │
│  │  │  • Информация о заседаниях и вопросах                            │       │  │
│  │  │  • Решения и краткие заключения                                  │       │  │
│  │  └──────────────────────────┬───────────────────────────────────────┘       │  │
│  │                             │                                                │  │
│  └─────────────────────────────┼────────────────────────────────────────────────┘  │
│                                │                                                   │
│                                ▼                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │                     External AI Services                                  │    │
│  │  ┌────────────────────────────────────────────────────────────┐          │    │
│  │  │  AlemLLM API (https://alemllm.sk-ai.kz/v1)                │          │    │
│  │  │  • Model: astanahub/alemllm (~246B params)                │          │    │
│  │  │  • Temperature: 0.3-0.6                                    │          │    │
│  │  │  • Max tokens: 512-1024                                    │          │    │
│  │  │  • On-prem deployment (ЦОД АО Казахтелеком)              │          │    │
│  │  └────────────────────────────────────────────────────────────┘          │    │
│  │  ┌────────────────────────────────────────────────────────────┐          │    │
│  │  │  TTS API (https://tts.sk-ai.kz/api/tts)                   │          │    │
│  │  │  • Returns: base64 audio data URI                          │          │    │
│  │  │  • Converted to Blob URL for playback                      │          │    │
│  │  │  • Multi-language support (ru/kk/en)                       │          │    │
│  │  └────────────────────────────────────────────────────────────┘          │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────┬───────────────────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   DATABASE                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL (82.200.129.219:5433/skai_main)                       │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │ DialogMeeting  │  │DialogQuestion  │  │   DialogFAQ    │                 │  │
│  │  │ • code         │  │ • meetingId    │  │ • questionRu   │                 │  │
│  │  │ • title (3 lng)│  │ • number       │  │ • answerRu     │                 │  │
│  │  │ • summary      │  │ • title (3 lng)│  │ • similarQs[]  │                 │  │
│  │  │ • overview     │  │ • texts (3 lng)│  │ • isActive     │                 │  │
│  │  │ • questions[]  │  │ • decision     │  │ • priority     │                 │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                 │  │
│  │  ┌────────────────┐  ┌────────────────┐                                      │  │
│  │  │     User       │  │    Session     │                                      │  │
│  │  │ • email        │  │ • userId       │                                      │  │
│  │  │ • name         │  │ • expires      │                                      │  │
│  │  │ • role         │  │ • sessionToken │                                      │  │
│  │  └────────────────┘  └────────────────┘                                      │  │
│  │                                                                               │  │
│  │                    Prisma ORM (v5.22.0)                                      │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              ADMIN PANEL                                            │
│  ┌────────────────────────────┐  ┌────────────────────────────┐                   │
│  │  /dialog/admin             │  │  /admin/dialog-faq         │                   │
│  │  • Manage meetings         │  │  • CRUD operations         │                   │
│  │  • Manage questions        │  │  • Generate similar Qs     │                   │
│  │  • Trigger phrases         │  │  • Multi-language support  │                   │
│  │  • Access: dialog_admin    │  │  • Priority & active flag  │                   │
│  └────────────────────────────┘  └────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT-SIDE FEATURES                                      │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐           │
│  │   TTS System       │  │  Language Switch   │  │  Theme Toggle      │           │
│  │  • useTTS hook     │  │  • ru/kk/en        │  │  • Dark/Light mode │           │
│  │  • TTSClient       │  │  • Context-based   │  │  • Persistent      │           │
│  │  • Blob URL cache  │  │  • Auto-detect     │  │                    │           │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘           │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐           │
│  │  Auth System       │  │  Video UI          │  │  Action Markers    │           │
│  │  • NextAuth.js     │  │  • Oval shape      │  │  • [ACTION:MEETING]│           │
│  │  • Credentials     │  │  • Auto-play on TTS│  │  • [ACTION:QUESTION]│          │
│  │  • Role-based      │  │  • Responsive      │  │  • Dynamic routing │           │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────────────┘

                              DATA FLOW - Dialog Chat

┌──────────┐        ┌──────────┐        ┌──────────────┐        ┌─────────────┐
│  User    │───────▶│  Next.js │───────▶│    Prisma    │───────▶│ PostgreSQL  │
│  Input   │        │  API     │        │              │        │             │
└──────────┘        └────┬─────┘        └──────────────┘        └─────────────┘
                         │
                         ├─────────▶ findRelevantFAQ()
                         │           ↓
                         │           FAQ Context (if match found)
                         │
                         ├─────────▶ buildKnowledgeContext()
                         │           ↓
                         │           Meeting/Question Context
                         │
                         ├─────────▶ buildSystemPrompt()
                         │           ↓
                         │           System Prompt + FAQ + Knowledge
                         │
                         ▼
                    ┌──────────┐
                    │ AlemLLM  │
                    │   API    │
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
                    │ Response │
                    │  + Parse │
                    │  Actions │
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐        ┌──────────┐
                    │   User   │◀───────│ TTS API  │
                    │ Response │        │ (optional)│
                    └──────────┘        └──────────┘

                              KEY FEATURES

┌─────────────────────────────────────────────────────────────────────┐
│  1. Multi-language Support (ru/kk/en)                               │
│  2. FAQ System with AI-powered similar question generation          │
│  3. Knowledge base from 260+ meetings, 13 laws, 64 internal docs    │
│  4. On-premise AlemLLM deployment (secure, no internet access)      │
│  5. Text-to-Speech with blob URL caching                            │
│  6. Dynamic routing with action markers                             │
│  7. Role-based access control                                       │
│  8. Real-time document analysis                                     │
│  9. Responsive UI with dark mode                                    │
│ 10. Admin panel for content management                              │
└─────────────────────────────────────────────────────────────────────┘

                        SECURITY & COMPLIANCE

┌─────────────────────────────────────────────────────────────────────┐
│  • On-premise deployment (ЦОД АО Казахтелеком)                      │
│  • No internet access for LLM                                        │
│  • SSO/RBAC access controls                                          │
│  • Encryption in transit and at rest                                 │
│  • Full audit logging                                                │
│  • Principle: "No reference - no statement"                          │
└─────────────────────────────────────────────────────────────────────┘
```

## Основные компоненты

### 1. **Frontend** (Next.js 15 + React 18)
- `/dialog` - Чат интерфейс с SKAI
- `/virtual-director` - Анализ документов
- `/np`, `/vnd` - Панели управления
- Multi-language UI
- TTS интеграция

### 2. **Backend** (Next.js API Routes)
- **Dialog Chat API** - основной чат с системным промптом
- **FAQ Matching** - поиск релевантных FAQ
- **Knowledge Builder** - контекст из заседаний
- **Action Parser** - маркеры для роутинга

### 3. **Database** (PostgreSQL + Prisma)
- Meetings & Questions
- FAQ с похожими вопросами
- Users & Sessions

### 4. **External Services**
- **AlemLLM** - локальная LLM (~246B параметров)
- **TTS API** - озвучка текста

### 5. **Admin Panel**
- Управление заседаниями
- Управление FAQ с AI-генерацией

## Особенности архитектуры

1. **Суверенный контур** - все работает on-premise
2. **RAG подход** - извлечение фактов из базы знаний
3. **FAQ система** - предопределенные ответы на типовые вопросы
4. **Верифицируемость** - каждое утверждение с источником
5. **Multi-tenancy** - поддержка ролей (admin, dialog_admin)
