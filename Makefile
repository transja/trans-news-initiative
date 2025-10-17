PHONY: github transja

protect:
	cd build/dashboard && npx staticrypt --short index.html -p $(shell if [ -f .env ]; then grep PASSWORD .env | cut -d '=' -f2; else echo $$PASSWORD; fi) -d .

github:
	rm -rf docs
	cp -r build docs
	touch docs/.nojekyll
	cp CNAME docs/
	git add -A
	git commit -m "update github pages"
	git push