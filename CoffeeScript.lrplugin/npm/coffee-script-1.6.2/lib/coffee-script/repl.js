// Generated by CoffeeScript 1.6.2
(function() {
  var CoffeeScript, addMultilineHandler, merge, nodeREPL, prettyErrorMessage, replDefaults, vm, _ref;

  vm = require('vm');

  nodeREPL = require('repl');

  CoffeeScript = require('./coffee-script');

  _ref = require('./helpers'), merge = _ref.merge, prettyErrorMessage = _ref.prettyErrorMessage;

  replDefaults = {
    prompt: 'coffee> ',
    "eval": function(input, context, filename, cb) {
      var Assign, Block, Literal, Value, ast, err, js, _ref1;

      input = input.replace(/\uFF00/g, '\n');
      input = input.replace(/^\(([\s\S]*)\n\)$/m, '$1');
      _ref1 = require('./nodes'), Block = _ref1.Block, Assign = _ref1.Assign, Value = _ref1.Value, Literal = _ref1.Literal;
      try {
        ast = CoffeeScript.nodes(input);
        ast = new Block([new Assign(new Value(new Literal('_')), ast, '=')]);
        js = ast.compile({
          bare: true,
          locals: Object.keys(context)
        });
        return cb(null, vm.runInContext(js, context, filename));
      } catch (_error) {
        err = _error;
        return cb(prettyErrorMessage(err, filename, input, true));
      }
    }
  };

  addMultilineHandler = function(repl) {
    var inputStream, multiline, nodeLineListener, outputStream, rli;

    rli = repl.rli, inputStream = repl.inputStream, outputStream = repl.outputStream;
    multiline = {
      enabled: false,
      initialPrompt: repl.prompt.replace(/^[^> ]*/, function(x) {
        return x.replace(/./g, '-');
      }),
      prompt: repl.prompt.replace(/^[^> ]*>?/, function(x) {
        return x.replace(/./g, '.');
      }),
      buffer: ''
    };
    nodeLineListener = rli.listeners('line')[0];
    rli.removeListener('line', nodeLineListener);
    rli.on('line', function(cmd) {
      if (multiline.enabled) {
        multiline.buffer += "" + cmd + "\n";
        rli.setPrompt(multiline.prompt);
        rli.prompt(true);
      } else {
        nodeLineListener(cmd);
      }
    });
    return inputStream.on('keypress', function(char, key) {
      if (!(key && key.ctrl && !key.meta && !key.shift && key.name === 'v')) {
        return;
      }
      if (multiline.enabled) {
        if (!multiline.buffer.match(/\n/)) {
          multiline.enabled = !multiline.enabled;
          rli.setPrompt(repl.prompt);
          rli.prompt(true);
          return;
        }
        if ((rli.line != null) && !rli.line.match(/^\s*$/)) {
          return;
        }
        multiline.enabled = !multiline.enabled;
        rli.line = '';
        rli.cursor = 0;
        rli.output.cursorTo(0);
        rli.output.clearLine(1);
        multiline.buffer = multiline.buffer.replace(/\n/g, '\uFF00');
        rli.emit('line', multiline.buffer);
        multiline.buffer = '';
      } else {
        multiline.enabled = !multiline.enabled;
        rli.setPrompt(multiline.initialPrompt);
        rli.prompt(true);
      }
    });
  };

  module.exports = {
    start: function(opts) {
      var build, major, minor, repl, _ref1;

      if (opts == null) {
        opts = {};
      }
      _ref1 = process.versions.node.split('.').map(function(n) {
        return parseInt(n);
      }), major = _ref1[0], minor = _ref1[1], build = _ref1[2];
      if (major === 0 && minor < 8) {
        console.warn("Node 0.8.0+ required for CoffeeScript REPL");
        process.exit(1);
      }
      opts = merge(replDefaults, opts);
      repl = nodeREPL.start(opts);
      repl.on('exit', function() {
        return repl.outputStream.write('\n');
      });
      addMultilineHandler(repl);
      return repl;
    }
  };

}).call(this);