# Team photos

Drop the founder photo at `saad-kadri.jpg` in this directory.

The about page (`apps/web/src/app/(marketing)/about/page.tsx`)
references `/team/saad-kadri.jpg` via `next/image`. While the file
is missing, the page renders an "SK" initials placeholder in the
photo frame.

## Recommended specs

- **Aspect:** 4:5 portrait (240×300 displayed; ship at 480×600 or
  720×900 for retina)
- **Format:** `.jpg` for compression, or `.webp` if you want
  ~30% smaller files
- **File size:** under 200 KB after compression
- **Subject framing:** chest-up to full-body works; avoid extreme
  close-ups (the frame's 4:5 ratio cuts hard at the edges)
- **Background:** any - the frame already has a subtle gradient
  behind the image, and `object-cover` handles the rest

## Replacing later

Same path. `next/image` will pick up the new file on the next
build with no code changes needed.
