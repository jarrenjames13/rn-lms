# React Native LMS App

## Rich-content mobile smoke test

`npm run test:smoke` verifies version-1 question/choice HTML selection, literal
legacy fallback, cookie-only same-origin `/api/media/{uuid}` image headers, and
production Expo/Metro bundles for Android and iOS. It needs no device, simulator,
signed-in account, or live API. GitHub Actions runs this command on every push and
pull request.
