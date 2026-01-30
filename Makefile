all: ts/*ts
	npm install
	./node_modules/typescript/bin/tsc
	./node_modules/esbuild/bin/esbuild ts/main.ts --bundle --minify --sourcemap --target=firefox58 --outfile=server/static/calibration-visualiser.js
