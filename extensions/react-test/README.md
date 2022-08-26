Currently (25 Aug, 2022), snowpack isn't hooked up to anything.

When developing, run `yarn run watch` as usual, then in another shell:

```
cd .\extensions\react-test
nodemon --watch src/webviews/ -e 'ts,tsx,css' --exec snowpack build
```

or run just `snowpack build` from `react-test`for a one-off build of the webview code.
