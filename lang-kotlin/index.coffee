# Simply add stars for newlines in KDoc comments
# Also provides autocomplete for tags in KDoc comments
module.exports =

  activate: ->
    @observe = atom.workspace.observeTextEditors (editor) =>
      editor.onDidInsertText (event) =>
        if (event.text is "\n") and (editor.getCursorScope().scopes.includes("comment.kdoc.kotlin"))
          editor.insertText "* " # Insert a star in new lines of kdoc comments

  deactivate: ->
    @observe?.dispose()

  provideKDocCompletion: -> {
    selector: '.source.kotlin .comment.kdoc.kotlin'

    getSuggestions: ({prefix, activatedManually}) ->
      new Promise (resolve) ->
        out = []

        createNone = (text) ->
          out.push {
            displayText: "@#{text}"
            snippet: "@#{text}"
            type: 'tag'
            replacementPrefix: "@#{prefix}"
          }
        createDoc = (text, extra = "Documentation") ->
          out.push {
            displayText: "@#{text}"
            snippet: "@#{text} ${1:#{extra}}"
            type: 'tag'
            replacementPrefix: "@#{prefix}"
          }
        createSingleWithDescription = (text, type = "Type", extra = "Documentation") ->
          out.push {
            displayText: "@#{text}"
            snippet: "@#{text} ${1:#{type}} ${2:#{extra}}"
            type: 'tag'
            replacementPrefix: "@#{prefix}"
          }

        # Create all of the types
        createSingleWithDescription("param", "Parameter")
        createDoc("return", "Type and documentation")
        createDoc("constructor", "Document main constructor")
        createDoc("receiver")
        createSingleWithDescription("property", "Property")
        createSingleWithDescription("throws")
        createSingleWithDescription("exception")
        createSingleWithDescription("sample", "Identifier")
        createSingleWithDescription("see", "Identifier")
        createDoc("author", "Name")
        createDoc("since", "v1.2.3")
        createNone("suppress")

        if activatedManually
          resolve(out)
        else
          resolve(out.filter((item) ->
            item.displayText.startsWith("@#{prefix}")
          ))
  }
