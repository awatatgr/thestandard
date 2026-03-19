# UAT Test Definition: Viewer Role v1.0

- **Product**: THE STANDARD (https://thestandard.coach)
- **Role**: Viewer (authenticated user)
- **Version**: 1.0
- **Date**: 2026-03-19
- **Standard**: ISTQB UAT / IEEE 829

---

## Step 1: User Stories & Acceptance Criteria

### US-01: Login via Magic Link (P0)
> As a viewer, I want to log in with my email address so that I can access the video platform without remembering a password.

**Acceptance Criteria:**
1. Login page shows email input and "Login link to send" button
2. Submitting a valid email sends a magic link and shows confirmation screen
3. Clicking the magic link in the email authenticates the user and redirects to `/`
4. Unauthenticated users are redirected to `/login`
5. Already logged-in users are redirected from `/login` to `/`

### US-02: Browse Video List (P0)
> As a viewer, I want to see all available videos on the home page so that I can choose what to watch.

**Acceptance Criteria:**
1. Home page displays a hero section with the first video (thumbnail, title, category badge, duration, angle count)
2. Remaining videos are shown in a responsive grid (1-4 columns depending on viewport)
3. Each video card shows thumbnail, title, category badge, duration, angle count, and recorded date
4. Clicking a card or the hero navigates to `/videos/:id`

### US-03: Filter Videos by Category (P1)
> As a viewer, I want to filter videos by category so that I can quickly find specific types of content.

**Acceptance Criteria:**
1. Category filter bar displays buttons: "All", "Training", "Drill", "Method", "Interview"
2. Selecting a category filters the grid (hero excluded from filter)
3. "All" shows all remaining videos
4. Empty results display "no videos" message
5. Active filter button has primary color styling

### US-04: Play Single-Angle Video (P0)
> As a viewer, I want to play a video in single view so that I can watch training content at my own pace.

**Acceptance Criteria:**
1. Video loads and displays poster image before playback
2. Clicking play starts HLS (or MP4 fallback) playback
3. Progress bar, time display, play/pause, skip, volume, and fullscreen controls are visible
4. Video plays inline on mobile (no forced native player)

### US-05: Switch Angles in Single View (P0)
> As a viewer, I want to switch camera angles so that I can see the exercise from different perspectives.

**Acceptance Criteria:**
1. Angle selector bar shows all available angles (e.g., "Front", "Side")
2. Clicking an angle loads the new stream without full page reload
3. Playback position is maintained when switching angles

### US-06: Multi-Angle Synchronized Playback (P0)
> As a viewer, I want to watch multiple angles simultaneously with synchronized playback so that I can compare form from different perspectives.

**Acceptance Criteria:**
1. Layout switcher offers Single / Equal / Main+Sub modes
2. Equal mode displays all angles side-by-side with equal sizing
3. Main+Sub mode displays the primary angle large with sub-angles smaller
4. All angles stay within 0.15s sync threshold (green SYNC indicator)
5. Sync toggle button allows enabling/disabling synchronization
6. Master controls (play/pause, seek, skip) apply to all angles simultaneously

### US-07: Chapter Navigation (P1)
> As a viewer, I want to jump to specific exercise chapters so that I can rewatch particular movements.

**Acceptance Criteria:**
1. Sidebar (desktop) shows chapter list with name, number, and start time
2. Active chapter is highlighted with primary color border
3. Past chapters are dimmed
4. Clicking a chapter seeks all players to that timestamp
5. Mobile accordion expands to show chapter list

### US-08: Subtitle Toggle (P1)
> As a viewer, I want to enable/disable subtitles so that I can follow spoken instructions.

**Acceptance Criteria:**
1. Subtitle toggle button appears only for videos with subtitle data
2. Toggling ON shows Japanese WebVTT subtitles on the video
3. Toggling OFF hides subtitles
4. Default state is subtitles ON

### US-09: Keyboard Shortcuts (P1)
> As a viewer, I want to use keyboard shortcuts so that I can control playback efficiently without a mouse.

**Acceptance Criteria:**
1. Space/K toggles play/pause
2. J skips back 10s, L skips forward 10s
3. Arrow keys skip 5s
4. F toggles fullscreen
5. M toggles mute
6. , / . step one frame backward/forward (single view)

### US-10: Playback Speed Control (P2)
> As a viewer, I want to change playback speed so that I can review movements in slow motion or speed through content.

**Acceptance Criteria:**
1. Speed button displays current rate (e.g., "1x")
2. Clicking opens menu with options: 0.25x, 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
3. Selecting a rate applies immediately to all synced angles
4. Active rate is highlighted in the menu

### US-11: Mobile Responsive Playback (P1)
> As a viewer, I want to watch videos comfortably on my phone so that I can review training on the go.

**Acceptance Criteria:**
1. Video list displays in single-column layout on mobile
2. Multi-angle view shows one angle at a time with tab switcher
3. Double-tap left/right side of video skips -10s/+10s
4. Touch targets are at least 40-44px
5. Controls are always visible (no hover dependency on touch devices)

### US-12: Navigation & Session (P1)
> As a viewer, I want to navigate between videos and manage my session so that I can browse content smoothly.

**Acceptance Criteria:**
1. Back arrow returns to video list from detail page
2. Sidebar video list shows all videos with active indicator
3. Clicking a video in sidebar navigates to that video
4. Header logo navigates to home
5. User menu shows email, logout option
6. Logging out redirects to login page

---

## Step 2: UAT Test Definitions

### Quest 1: Authentication & Access Control

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| VIEW-001 | Magic link login - valid email | Not logged in, on `/login` | 1. Enter email address in the input field | Email field accepts the value and submit button is enabled | `test-viewer@example.com` | Yes |
| VIEW-002 | Magic link send confirmation | VIEW-001 completed | 1. Click "Login link to send" button | Screen changes to confirmation: mail icon displayed, message "Check your email" shown, entered email address displayed | `test-viewer@example.com` | Yes |
| VIEW-003 | Switch to different email | VIEW-002 completed (confirmation screen) | 1. Click "Use a different email address" link | Returns to email input form with empty field | - | No |
| VIEW-004 | Login form - empty email submit | On `/login`, email field is empty | 1. Click "Login link to send" button | Browser native validation prevents submit (required field) | (empty) | No |
| VIEW-005 | Login form - invalid email format | On `/login` | 1. Enter invalid email format 2. Click "Login link to send" button | Browser native validation shows email format error | `notanemail` | No |
| VIEW-006 | Unauthenticated redirect | Not logged in | 1. Navigate directly to `https://thestandard.coach/` | Redirected to `/login` page | - | Yes |
| VIEW-007 | Unauthenticated video detail redirect | Not logged in | 1. Navigate directly to `https://thestandard.coach/videos/stretch-full` | Redirected to `/login` page | URL: `/videos/stretch-full` | No |
| VIEW-008 | Already authenticated redirect | Logged in as viewer | 1. Navigate to `/login` | Redirected to `/` (home page) | - | No |
| VIEW-009 | Logout flow | Logged in as viewer, on home page | 1. Click user avatar/name in header 2. Click "Logout" button | User is logged out and redirected to `/login` | - | No |
| VIEW-010 | Loading state during auth check | Session state unknown | 1. Navigate to `/` | "Loading..." message is displayed while auth state resolves | - | No |

### Quest 2: Video List & Hero Section

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| VIEW-011 | Hero section display | Logged in, on `/` | 1. Observe the hero section at the top | Hero shows: thumbnail image, title "Stretch & Mobility -- Full Session", category badge "Training" (blue), duration "10:12", angle count "2 angles", description text, "Play" button | Video: `stretch-full` | Yes |
| VIEW-012 | Hero click navigates to detail | Logged in, on `/` | 1. Click anywhere on the hero section | Navigated to `/videos/stretch-full` | Video: `stretch-full` | Yes |
| VIEW-013 | Hero play button navigates | Logged in, on `/` | 1. Click the "Play" button in hero | Navigated to `/videos/stretch-full` | Video: `stretch-full` | No |
| VIEW-014 | Video grid displays all videos | Logged in, on `/`, filter "All" selected | 1. Observe the video grid below hero | Grid shows 6 video cards (all except hero): `running-form`, `warmup-stretch`, `treadmill-run`, `squat-lunge`, `stretch-3view`, `trainer-session` | - | Yes |
| VIEW-015 | Video card content | Logged in, on `/` | 1. Observe the `squat-lunge` video card | Card shows: thumbnail, title "Barbell Squat & Lunge", category badge "Drill" (amber), chapter "Weight Training", duration "3:17", angle count badge "2" | Video: `squat-lunge` | No |
| VIEW-016 | Video card multi-angle badge | Logged in, on `/` | 1. Observe the `stretch-3view` card | Top-right corner shows angle count badge with layer icon and "3" | Video: `stretch-3view` (3 angles) | No |
| VIEW-017 | Video card duration badge | Logged in, on `/` | 1. Observe the `trainer-session` card | Bottom-right of thumbnail shows "13:15" duration badge | Video: `trainer-session` (795s) | No |
| VIEW-018 | Video card click navigation | Logged in, on `/` | 1. Click the `running-form` video card | Navigated to `/videos/running-form` | Video: `running-form` | Yes |
| VIEW-019 | Video card hover effect | Logged in, on `/`, desktop viewport | 1. Hover over any video card | Card border changes to primary color tint, play icon overlay appears on thumbnail | - | No |
| VIEW-020 | Responsive grid - desktop | Logged in, on `/`, viewport >= 1280px | 1. Observe video grid | Grid displays 4 columns | - | No |
| VIEW-021 | Responsive grid - tablet | Logged in, on `/`, viewport ~768px | 1. Observe video grid | Grid displays 2 columns | - | No |
| VIEW-022 | Responsive grid - mobile | Logged in, on `/`, viewport ~375px | 1. Observe video grid | Grid displays 1 column | - | No |

### Quest 3: Category Filter

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| VIEW-023 | Filter bar display | Logged in, on `/` | 1. Observe category filter bar | Shows buttons: "All" (active/primary), "Training", "Drill", "Method", "Interview" | - | Yes |
| VIEW-024 | Filter by Training | Logged in, on `/` | 1. Click "Training" button | Grid shows only training videos: `running-form`, `warmup-stretch`, `treadmill-run`. "Training" button has primary color. Hero remains unchanged | Category: `training` | Yes |
| VIEW-025 | Filter by Drill | Logged in, on `/` | 1. Click "Drill" button | Grid shows only drill videos: `squat-lunge`. "Drill" button has primary color | Category: `drill` | No |
| VIEW-026 | Filter by Method | Logged in, on `/` | 1. Click "Method" button | Grid shows only method videos: `stretch-3view`, `trainer-session`. "Method" button has primary color | Category: `method` | No |
| VIEW-027 | Filter by Interview | Logged in, on `/` | 1. Click "Interview" button | Grid shows empty state: "No videos" message displayed | Category: `interview` | No |
| VIEW-028 | Reset filter to All | Logged in, on `/`, "Drill" filter active | 1. Click "All" button | Grid shows all 6 videos again. "All" button has primary color | - | No |
| VIEW-029 | Filter persistence after navigation | Logged in, on `/`, "Training" filter active | 1. Click a training video card 2. Click back arrow on detail page | Returns to `/` (filter state may reset to "All" as it is component state) | - | No |
| VIEW-030 | Filter bar horizontal scroll (mobile) | Logged in, on `/`, viewport ~375px | 1. Observe filter bar 2. Swipe horizontally on filter bar | Filter buttons are scrollable horizontally without page scroll | - | No |

### Quest 4: Single View Playback & Angle Switching

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| VIEW-031 | Video detail page load | Logged in, navigated to `/videos/stretch-full` | 1. Observe the page | Title bar shows "Stretch & Mobility -- Full Session" with back arrow. Layout switcher shows Single/Equal/Main+Sub icons. Player area shows poster image. Info section shows title, "Training" badge, "Stretch" chapter, "2026-03-16" date, "2 angles", description | Video: `stretch-full` | Yes |
| VIEW-032 | Default layout for 2-angle video | Logged in, navigated to `/videos/stretch-full` | 1. Observe initial layout mode | Equal layout is selected by default (equal icon highlighted) | Video: `stretch-full` (2 angles) | No |
| VIEW-033 | Default layout for 3-angle video | Logged in, navigated to `/videos/stretch-3view` | 1. Observe initial layout mode | Main+Sub layout is selected by default (grid icon highlighted) | Video: `stretch-3view` (3 angles) | No |
| VIEW-034 | Switch to single view | On `/videos/stretch-full`, equal layout active | 1. Click the Single view icon (monitor) | Layout changes to single video player with angle selector bar below. Angle selector shows "Front" (active) and "Side" | Video: `stretch-full` | Yes |
| VIEW-035 | Play video in single view | VIEW-034 completed, single view | 1. Click play button on video player | Video starts playing. Play button changes to pause. Time display updates. Progress bar moves | Video: `stretch-full` | Yes |
| VIEW-036 | Pause video | VIEW-035 completed, video playing | 1. Click pause button | Video pauses. Pause button changes to play. Time display stops | - | No |
| VIEW-037 | Seek via progress bar | Video loaded in single view | 1. Click/drag progress bar to ~5:00 position | Video seeks to approximately 5:00. Time display updates to ~5:00 | Video: `stretch-full` (10:12 total) | No |
| VIEW-038 | Skip forward 10s | Video playing at 1:00 in single view | 1. Click skip forward button (SkipForward icon) | Time advances to approximately 1:10 | - | No |
| VIEW-039 | Skip backward 10s | Video playing at 1:00 in single view | 1. Click skip backward button (SkipBack icon) | Time goes back to approximately 0:50 | - | No |
| VIEW-040 | Skip backward at start boundary | Video at 0:03 in single view | 1. Click skip backward button | Time goes to 0:00 (does not go negative) | - | No |
| VIEW-041 | Switch angle: Front to Side | Single view, "Front" angle selected, video at 2:30 | 1. Click "Side" button in angle selector | Video switches to side angle stream. "Side" button becomes primary. Playback position maintained near 2:30 | Video: `stretch-full`, Angle: Side | Yes |
| VIEW-042 | Switch angle: Side to Front | Single view, "Side" angle selected | 1. Click "Front" button in angle selector | Video switches to front angle stream. "Front" button becomes primary | Video: `stretch-full`, Angle: Front | No |
| VIEW-043 | Volume control - mute | Video playing in single view, volume on | 1. Click mute button (volume icon) | Volume icon changes to VolumeX (muted). Audio stops | - | No |
| VIEW-044 | Volume control - unmute | Video playing, muted | 1. Click mute button (VolumeX icon) | Volume icon changes to Volume2. Audio resumes | - | No |
| VIEW-045 | Volume slider | Video playing in single view (desktop) | 1. Drag volume slider to ~50% | Volume adjusts. Slider position reflects ~50% | - | No |
| VIEW-046 | Volume slider to zero | Video playing (desktop) | 1. Drag volume slider to 0 | Audio muted, icon changes to VolumeX | - | No |
| VIEW-047 | Fullscreen toggle on | Video loaded in single view | 1. Click fullscreen button (Maximize icon) | Player enters fullscreen mode | - | No |
| VIEW-048 | Fullscreen toggle off | Player in fullscreen | 1. Click fullscreen button or press Esc | Player exits fullscreen, returns to normal layout | - | No |
| VIEW-049 | Time display format | Video loaded (duration > 1min) | 1. Observe time display | Format shows "M:SS / M:SS" (e.g., "0:00 / 10:12") | Video: `stretch-full` | No |
| VIEW-050 | Video load error state | Video with invalid/missing stream URL | 1. Observe player area | Error overlay shows "Failed to load video" message | Invalid stream ID | No |
| VIEW-051 | Non-existent video page | Logged in, navigate to `/videos/nonexistent-id` | 1. Observe page | Shows "Video not found" message with "Return to list" link | URL: `/videos/nonexistent-id` | No |

### Quest 5: Multi-Angle Synchronized Playback

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| VIEW-052 | Equal layout - 2 angles | On `/videos/stretch-full`, equal layout | 1. Observe player grid | Two video panels displayed side-by-side with equal width. Each panel shows angle label ("Front", "Side"). Master panel shows "MAIN" badge | Video: `stretch-full` (2 angles) | Yes |
| VIEW-053 | Equal layout - 3 angles | On `/videos/stretch-3view`, equal layout selected | 1. Click equal layout icon 2. Observe player grid | Three video panels displayed in 3-column grid. "Main" panel has "MAIN" badge | Video: `stretch-3view` (3 angles) | Yes |
| VIEW-054 | Main+Sub layout - 3 angles | On `/videos/stretch-3view`, main+sub layout | 1. Observe player grid | Main angle is large (left, spanning rows), two sub-angles are stacked on right, smaller | Video: `stretch-3view` (3 angles) | Yes |
| VIEW-055 | Synchronized play | Multi-angle view (equal layout), videos paused | 1. Click master play button in bottom controls | All angles start playing simultaneously | Video: `stretch-full` | Yes |
| VIEW-056 | Synchronized pause | Multi-angle view, all angles playing | 1. Click master pause button | All angles pause simultaneously | - | Yes |
| VIEW-057 | Synchronized seek | Multi-angle view, videos loaded | 1. Drag master progress bar to 3:00 | All angles seek to 3:00 position. Time display shows ~3:00 | Video: `stretch-full` | Yes |
| VIEW-058 | Sync indicator - green | Multi-angle playing, sync enabled | 1. Observe sync indicators on sub-angle panels | Sub-angles show green dot with "SYNC" text (drift < 0.1s) | - | No |
| VIEW-059 | Sync toggle - disable | Multi-angle, sync enabled (green button "Syncing") | 1. Click sync toggle button | Button changes to "Sync OFF" with gray styling. Sync indicators disappear from sub-angles | - | No |
| VIEW-060 | Sync toggle - re-enable | Multi-angle, sync disabled | 1. Click sync toggle button | Button changes to "Syncing" with green styling. All sub-angles re-sync to master time | - | No |
| VIEW-061 | Individual pause on sub-angle | Multi-angle playing, sync enabled | 1. Hover over a sub-angle panel 2. Click the pause button overlay | That specific angle pauses. Overlay shows pause icon. Other angles continue. Sync indicator shows "Paused" | - | No |
| VIEW-062 | Individual resume on sub-angle | VIEW-061 completed, one angle paused | 1. Click the play button on the paused angle | Angle resumes and re-syncs to master time | - | No |
| VIEW-063 | Individual mute on sub-angle | Multi-angle view | 1. Hover over a sub-angle 2. Click the mute/unmute button | Audio toggles for that specific angle. Icon changes between Volume2/VolumeX | - | No |
| VIEW-064 | Default mute state | Multi-angle view loaded | 1. Observe mute state of each angle | Master angle is unmuted, all sub-angles are muted by default | - | No |
| VIEW-065 | Master skip forward in multi-view | Multi-angle playing at 1:00 | 1. Click skip forward button in master controls | All angles advance to ~1:10 | - | No |
| VIEW-066 | Master skip backward in multi-view | Multi-angle playing at 2:00 | 1. Click skip backward button in master controls | All angles go back to ~1:50 | - | No |
| VIEW-067 | Fullscreen multi-view | Multi-angle view (equal layout) | 1. Click fullscreen button in master controls | Entire multi-view container enters fullscreen with all angles visible | - | No |
| VIEW-068 | Layout switch preserves playback | Multi-angle playing at 4:00 in equal layout | 1. Click Main+Sub layout icon | Layout changes to main+sub. Playback continues near 4:00 | Video: `stretch-3view` | No |

### Quest 6: Chapters & Exercise Overlay

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| VIEW-069 | Chapter sidebar display | On `/videos/stretch-3view`, desktop viewport | 1. Observe right sidebar | Sidebar shows "Chapters" tab (active) and "Video List" tab. Chapter list shows 16 chapters with numbers (1-16), names, and start times | Video: `stretch-3view` (16 chapters) | Yes |
| VIEW-070 | Chapter list content | VIEW-069 completed | 1. Observe first 3 chapters | Ch 1: "Preparation" 0:00, Ch 2: "Seated Forward Fold (Warmup)" 0:17, Ch 3: "Seated Forward Fold Hold" 1:31 | Video: `stretch-3view` | No |
| VIEW-071 | Active chapter highlight | Video playing at 0:30 (chapter 2 active) | 1. Observe chapter list | Chapter 2 "Seated Forward Fold (Warmup)" highlighted with primary color left border and white text. Chapter 1 is dimmed | Video: `stretch-3view`, Time: 0:30 | Yes |
| VIEW-072 | Chapter click seek | On chapter sidebar | 1. Click chapter 5 "Ankle Circles & Mobility" | All players seek to 2:10 (130s). Chapter 5 becomes active/highlighted | Video: `stretch-3view`, Chapter: 5 | Yes |
| VIEW-073 | Chapter click seek - last chapter | On chapter sidebar | 1. Click chapter 16 "Finish (Full Body Stretch)" | All players seek to 9:45 (585s). Chapter 16 becomes active | Video: `stretch-3view`, Chapter: 16 | No |
| VIEW-074 | Exercise overlay display | Video playing at 0:20 (chapter 2) | 1. Observe video overlay | Top-left shows exercise name "Seated Forward Fold (Warmup)". Top-right shows progress badge "2 / 16" | Video: `stretch-3view`, Time: 0:20 | Yes |
| VIEW-075 | Exercise overlay progress dots | Video playing, exercise overlay visible | 1. Observe bottom of video | Progress dots at bottom: dot 2 is active (larger, primary color), dot 1 is dimmed (past), dots 3-16 are white/dim (future) | Video: `stretch-3view` | No |
| VIEW-076 | Exercise dot click | Exercise overlay visible | 1. Click dot number 8 | Video seeks to chapter 8 "Hamstring Stretch (Right Leg)" at 5:12 (312s). Dot 8 becomes active | Video: `stretch-3view`, Chapter: 8 | No |
| VIEW-077 | Exercise overlay transition | Video approaching chapter boundary (at ~1:29) | 1. Wait for playback to cross 1:31 | Exercise name changes from "Seated Forward Fold (Warmup)" to "Seated Forward Fold Hold". Progress updates from "2/16" to "3/16" with fade animation | Video: `stretch-3view` | No |
| VIEW-078 | Sidebar tab: Chapters to Video List | On sidebar with Chapters tab active | 1. Click "Video List" tab | Tab switches to video list showing all 7 videos with thumbnails. Current video highlighted with play icon overlay | Video: `stretch-3view` | No |
| VIEW-079 | Sidebar tab: Video List to Chapters | On sidebar with Video List tab active | 1. Click "Chapters" tab | Tab switches back to chapter list | - | No |
| VIEW-080 | Sidebar toggle (close) | Desktop viewport, sidebar open | 1. Click sidebar toggle button (PanelRightClose icon) in title bar | Sidebar collapses (width 0). Toggle icon changes to PanelRightOpen | - | No |
| VIEW-081 | Sidebar toggle (open) | Desktop viewport, sidebar closed | 1. Click sidebar toggle button (PanelRightOpen icon) | Sidebar expands to 320-384px width. Chapter list visible | - | No |
| VIEW-082 | Mobile chapter accordion - expand | On `/videos/stretch-3view`, mobile viewport | 1. Tap "Chapters (16)" accordion header | Accordion expands showing all 16 chapters. Chevron rotates 180 degrees | Video: `stretch-3view` | No |
| VIEW-083 | Mobile chapter accordion - collapse | Mobile viewport, accordion expanded | 1. Tap "Chapters (16)" accordion header | Accordion collapses. Chevron returns to default | - | No |
| VIEW-084 | Video without chapters - sidebar | On `/videos/stretch-full`, desktop viewport | 1. Observe sidebar | Sidebar shows only "Video List" header (no tabs). Lists all 7 videos | Video: `stretch-full` (no chapters) | No |
| VIEW-085 | Trainer session chapters | On `/videos/trainer-session` | 1. Observe chapter list | Shows 15 chapters. First: "Introduction & Warmup" 0:00, Last: "Summary Talk" 12:00 | Video: `trainer-session` (15 chapters) | No |

### Quest 7: Subtitles

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| VIEW-086 | Subtitle toggle button presence - with subs | On `/videos/stretch-full` detail page | 1. Observe layout switcher bar | Subtitle toggle button (Subtitles icon) is visible next to layout mode buttons | Video: `stretch-full` (has `/subs/stretch.vtt`) | Yes |
| VIEW-087 | Subtitle toggle button absence - no subs | On `/videos/running-form` detail page | 1. Observe layout switcher bar | No subtitle toggle button visible (only layout mode buttons) | Video: `running-form` (no subtitles) | No |
| VIEW-088 | Subtitles ON by default | On `/videos/stretch-full`, video playing | 1. Observe subtitle toggle and video | Subtitle button has primary color highlight. Japanese subtitle text is visible over video | Video: `stretch-full`, Sub: `/subs/stretch.vtt` | Yes |
| VIEW-089 | Toggle subtitles OFF | Subtitles currently ON | 1. Click subtitle toggle button | Subtitle button color changes to gray/inactive. Subtitle text disappears from video | - | Yes |
| VIEW-090 | Toggle subtitles ON | Subtitles currently OFF | 1. Click subtitle toggle button | Subtitle button returns to primary color. Subtitle text reappears on video | - | No |
| VIEW-091 | Subtitles in single view | Single view, subtitles ON, video playing | 1. Observe subtitle text on video | Japanese WebVTT subtitles render on the single video player | Video: `stretch-full`, Single view | No |
| VIEW-092 | Subtitles in multi-view | Equal layout on `stretch-3view`, subtitles ON | 1. Observe subtitle on main angle | Subtitles render on the "Main" angle panel (which has `subtitleUrl`) | Video: `stretch-3view` | No |
| VIEW-093 | Subtitle toggle in single view player controls | Single view on `stretch-full` | 1. Observe player control bar (bottom) | Subtitle button visible in right section of controls. Click toggles subtitle track mode | Video: `stretch-full` | No |

### Quest 8: Keyboard Shortcuts

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| VIEW-094 | Space key - play | Single view, video paused, focus on body/player | 1. Press Space key | Video starts playing. Play icon changes to pause | Video: `stretch-full` | Yes |
| VIEW-095 | Space key - pause | Single view, video playing | 1. Press Space key | Video pauses. Pause icon changes to play | - | No |
| VIEW-096 | K key - toggle play | Single view, video paused | 1. Press K key | Video starts playing (same as Space) | - | No |
| VIEW-097 | J key - skip back 10s | Single view, video at 0:30 | 1. Press J key | Video seeks to ~0:20. Time display updates | - | Yes |
| VIEW-098 | L key - skip forward 10s | Single view, video at 0:30 | 1. Press L key | Video seeks to ~0:40. Time display updates | - | No |
| VIEW-099 | Arrow Left - skip back 5s | Single view, video at 0:30 | 1. Press Left Arrow key | Video seeks to ~0:25 | - | No |
| VIEW-100 | Arrow Right - skip forward 5s | Single view, video at 0:30 | 1. Press Right Arrow key | Video seeks to ~0:35 | - | No |
| VIEW-101 | F key - fullscreen toggle | Single view, not fullscreen | 1. Press F key | Player enters fullscreen | - | No |
| VIEW-102 | M key - mute toggle | Single view, video playing, unmuted | 1. Press M key | Audio mutes. Volume icon changes to VolumeX | - | No |
| VIEW-103 | M key - unmute | Single view, video muted | 1. Press M key | Audio unmutes. Volume icon changes to Volume2 | - | No |
| VIEW-104 | Comma key - frame step back | Single view, video paused at 0:10 | 1. Press , (comma) key | Video steps back 1 frame (~0.033s). Video stays paused | - | No |
| VIEW-105 | Period key - frame step forward | Single view, video paused at 0:10 | 1. Press . (period) key | Video steps forward 1 frame (~0.033s). Video stays paused | - | No |
| VIEW-106 | Space key in multi-view | Equal layout, videos paused | 1. Press Space key | All angles start playing simultaneously | Video: `stretch-full`, Equal layout | No |
| VIEW-107 | J/L keys in multi-view | Equal layout, videos at 1:00 | 1. Press L key | All angles skip forward to ~1:10 | Video: `stretch-full`, Equal layout | No |
| VIEW-108 | F key in multi-view | Equal layout | 1. Press F key | Entire multi-view container enters fullscreen | - | No |
| VIEW-109 | Keyboard when input focused | On login page, email input focused | 1. Press Space key | Space character typed in input (shortcut not triggered) | - | No |

### Quest 9: Playback Speed

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| VIEW-110 | Speed button display | Single view, video loaded | 1. Observe player controls (right side) | Button shows "1x" text (default speed) | - | Yes |
| VIEW-111 | Speed menu open | Single view | 1. Click "1x" speed button | Dropdown menu appears above button showing: 0.25x, 0.5x, 0.75x, 1x (highlighted red), 1.25x, 1.5x, 2x | - | Yes |
| VIEW-112 | Select 0.5x speed | Speed menu open | 1. Click "0.5x" option | Menu closes. Button shows "0.5x". Video plays at half speed. Audio pitch affected | Rate: 0.5 | No |
| VIEW-113 | Select 2x speed | Speed menu open | 1. Click "2x" option | Menu closes. Button shows "2x". Video plays at double speed | Rate: 2 | No |
| VIEW-114 | Select 0.25x speed | Speed menu open | 1. Click "0.25x" option | Menu closes. Button shows "0.25x". Video plays at quarter speed (slow motion) | Rate: 0.25 | No |
| VIEW-115 | Reset to 1x speed | Speed at 0.5x, menu open | 1. Click "1x" option | Menu closes. Button shows "1x". Video plays at normal speed | Rate: 1 | No |
| VIEW-116 | Speed in multi-view | Equal layout, sync enabled, speed at 1x | 1. Click speed button 2. Select "1.5x" | All synced angles play at 1.5x speed. Button shows "1.5x" | Rate: 1.5, Video: `stretch-full` | No |
| VIEW-117 | Active rate highlight | Speed menu open, current rate is 0.75x | 1. Observe menu | "0.75x" option is highlighted in red/bold. Other options in normal style | Rate: 0.75 | No |
| VIEW-118 | Speed persists during seek | Playing at 2x speed | 1. Drag progress bar to different position | Playback continues at 2x after seek | Rate: 2 | No |

### Quest 10: Mobile & Touch Interactions

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| VIEW-119 | Mobile video list layout | Logged in, mobile viewport (375px) | 1. Observe home page | Single column grid. Hero section with 21:9 aspect. Cards stacked vertically. Filter bar horizontally scrollable | - | Yes |
| VIEW-120 | Mobile detail page - single view controls | On `/videos/stretch-full`, mobile viewport, single view | 1. Observe player controls | Play/pause, skip buttons, time display, speed, fullscreen visible. Touch targets are at least 40px (h-10 w-10 classes) | Video: `stretch-full` | Yes |
| VIEW-121 | Mobile multi-view - angle tabs | On `/videos/stretch-full`, equal layout, mobile viewport | 1. Observe below video | Angle tab bar shown: "Front" and "Side" buttons. Only one angle video visible at a time | Video: `stretch-full` | Yes |
| VIEW-122 | Mobile angle tab switch | Mobile, multi-view, "Front" tab active | 1. Tap "Side" tab | Video switches to side angle. "Side" tab becomes primary color. "Front" becomes gray | Video: `stretch-full` | No |
| VIEW-123 | Mobile multi-view - 3 angles | On `/videos/stretch-3view`, multi-view, mobile viewport | 1. Observe angle tabs | Three tabs shown: "Main MAIN", "Front", "Side". Tapping switches visible angle | Video: `stretch-3view` | No |
| VIEW-124 | Double-tap right side - skip forward | Mobile viewport, video playing | 1. Double-tap right half of video area | Video skips forward 10s. "+10s" feedback bubble appears on right side and fades | - | Yes |
| VIEW-125 | Double-tap left side - skip backward | Mobile viewport, video at 0:30 | 1. Double-tap left half of video area | Video skips backward 10s. "-10s" feedback bubble appears on left side and fades | - | No |
| VIEW-126 | Double-tap at video start | Mobile viewport, video at 0:03 | 1. Double-tap left half of video area | Video seeks to 0:00 (no negative time). "-10s" feedback shown | - | No |
| VIEW-127 | Single tap shows controls | Mobile viewport, video playing, controls hidden | 1. Single-tap video area | Controls become visible (opacity 100%) | - | No |
| VIEW-128 | Controls auto-hide | Mobile viewport, video playing, controls visible | 1. Wait 3 seconds without interaction | Controls fade out (opacity 0%) | - | No |
| VIEW-129 | Touch target sizes - play button | Mobile viewport, controls visible | 1. Observe play/pause button | Button has minimum 44px touch target (h-11 w-11 class) | - | No |
| VIEW-130 | Touch target sizes - skip buttons | Mobile viewport, controls visible | 1. Observe skip forward/backward buttons | Buttons have minimum 40px touch target (h-10 w-10 class) | - | No |
| VIEW-131 | Touch target sizes - speed button | Mobile viewport, controls visible | 1. Observe speed button | Button has minimum 44px width (min-w-[44px]) and 40px height (h-10) | - | No |
| VIEW-132 | Mobile header - user menu | Mobile viewport, logged in | 1. Observe header | User avatar shown (no email text on small screens). Tap opens dropdown with email, logout | - | No |
| VIEW-133 | Mobile progress bar thumb | Mobile viewport, video loaded | 1. Observe progress bar slider | Slider thumb is 24px (h-6 w-6) for easy touch interaction | - | No |
| VIEW-134 | Mobile chapter accordion | On `/videos/trainer-session`, mobile viewport | 1. Observe below video info | "Chapters (15)" accordion visible. No sidebar. Tap expands chapter list | Video: `trainer-session` | No |
| VIEW-135 | Inline playback on iOS | Mobile Safari (iOS), video loaded | 1. Tap play | Video plays inline within the page (not native fullscreen). playsInline attribute present | - | No |

---

## Summary

| Metric | Value |
|--------|-------|
| Total Test Cases | 135 |
| Quest Count | 10 |
| P0 Tests | VIEW-001 ~ VIEW-068 (core auth, list, playback, multi-angle) |
| P1 Tests | VIEW-069 ~ VIEW-109 (chapters, subtitles, keyboard, navigation) |
| P2 Tests | VIEW-110 ~ VIEW-135 (speed, mobile polish) |
| Blocking Tests | 31 / 135 (23%) |
| Non-Blocking Tests | 104 / 135 (77%) |

### Test Data Reference

| Video ID | Title | Category | Duration | Angles | Chapters | Subtitles |
|----------|-------|----------|----------|--------|----------|-----------|
| `stretch-full` | Stretch & Mobility -- Full Session | training | 10:12 (612s) | 2 (Front/Side) | - | Yes (`/subs/stretch.vtt`) |
| `running-form` | Treadmill Running Form Analysis | training | 1:39 (99s) | 2 (Front/Side) | - | No |
| `warmup-stretch` | Warmup & Stretch | training | 2:17 (137s) | 2 (Front/Side) | - | No |
| `treadmill-run` | Treadmill Running | training | 3:35 (215s) | 2 (Front/Side) | - | No |
| `squat-lunge` | Barbell Squat & Lunge | drill | 3:17 (197s) | 2 (Front/Side) | - | No |
| `stretch-3view` | 3-Video Stretch & Mobility -- Full Session | method | 10:12 (612s) | 3 (Main/Front/Side) | 16 | Yes (`/subs/stretch.vtt`) |
| `trainer-session` | Trainer Exercise Instruction Session | method | 13:15 (795s) | 3 (Main/Front/Side) | 15 | Yes (`/subs/trainer-session.vtt`) |
