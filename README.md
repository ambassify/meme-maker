# track-js

In-browser meme creator powered by lodash templates

- `dist/` has the latest (UMD-build) release for browsers.
- `lib/` has the latest babelified build for use with bundlers.

You can use `https://cdn.rawgit.com/ambassify/meme-maker/[tag]/dist/meme.js` in your regular HTML scripts by filling in the desired tag.

Example using `v0.1.0`:

```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title></title>
        <script src="https://cdn.rawgit.com/ambassify/meme-maker/v0.1.0/dist/meme.js"></script>
    </head>
    <body>
        <div id="template"></div>
        <script>
            var container = document.getElementById('template');
            var meme = new MemeMaker(container);
            meme.configure({
                html: '<div>your {{ data.name }} template</div>',
                variables: {
                    name: 'awesome'
                }
            });
        </script>
    </body>
</html>
```

## Release

Use `npm version [patch|minor|major]` to publish new releases. It will automatically build the project, commit the new build and create a git tag.
