# How to run the frontend

all of these assume you have the backend built as a release already

## How to package with electron
to package with electron you need to:
npm run package
then you need to go to scripts and run `node copy-backend.js`

## How to run with electron
to run with electron typically you need to:
npm run build
go to scripts and run `node copy-backend-dev.js`
npm run start
npm run electron

## Easier way to run with electron
to run with dev, which is preferred for testing electron:
npm run build
go to scripts and run `node copy-backend-dev.js`
npm run dev

## Normal run script
to run normally:
`npm run start`
