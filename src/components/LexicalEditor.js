"use client";

import { useEffect, useState } from "react";
import {
    LexicalComposer,
    InitialEditorStateType,
} from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { $getRoot, $getSelection } from "lexical";
import Toolbar, { SET_FONT_SIZE_COMMAND } from "./LexicalToolbar"; // Import toolbar
import "./LexicalEditor.css"; // Import styles

export default function LexicalEditor({ content, setContent }) {
    const editorConfig = {
        namespace: "LexicalEditor",
        theme: {}, // You can add a theme later
        onError(error) {
            console.error(error);
        },
        editorState: content || null, // Load saved content
    };

    const handleChange = (editorState) => {
        editorState.read(() => {
            const htmlString = $getRoot().getTextContent();
            setContent(htmlString);
        });
    };

    return (
        <LexicalComposer initialConfig={editorConfig}>
            <div className="lexical-container border border-gray-300 rounded-md p-3">
                {/* Toolbar for Formatting */}
                <Toolbar />

                {/* Editor */}
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable className="lexical-content outline-none border-none w-full min-h-[150px] p-2" />
                    }
                    placeholder={<p className="text-gray-400">Write here...</p>}
                    ErrorBoundary={LexicalErrorBoundary}
                />

                {/* Plugins */}
                <OnChangePlugin onChange={handleChange} />
                <HistoryPlugin />
                <AutoFocusPlugin />
            </div>
        </LexicalComposer>
    );
}
