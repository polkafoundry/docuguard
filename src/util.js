exports.handleOptions = res => {
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("access-control-allow-credentials", "true");
    res.setHeader("access-control-allow-methods", "GET, POST, PUT, OPTIONS");
    res.setHeader("access-control-allow-headers", "Authorization");
    res.setHeader("access-control-max-age", 86400);
    res.setHeader("Content-Type", "text/plain charset=UTF-8");
    res.setHeader("Content-Type", 0);
    res.writeHead(204); // no content
    res.end();
};

exports.endWithCode = (res, code, err) => {
    res.setHeader("access-control-allow-origin", "*");
    if (err != null) {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(code);
        res.end(JSON.stringify({
            success: false,
            error: String(err)
        }))
    } else {
        res.writeHead(code);
        res.end()
    }
};

exports.success = (res, content) => {
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(content))
};