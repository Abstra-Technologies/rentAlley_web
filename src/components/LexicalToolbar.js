"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getSelection,
    $isRangeSelection,
    FORMAT_TEXT_COMMAND,
    COMMAND_PRIORITY_CRITICAL,
    createCommand,
} from "lexical";
import { useEffect } from "react";

// Create a command for setting font size
export const SET_FONT_SIZE_COMMAND = createCommand("SET_FONT_SIZE");

export default function LexicalToolbar() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // Register font size command
        editor.registerCommand(
            SET_FONT_SIZE_COMMAND,
            (size) => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    selection.formatText("fontSize", size);
                }
                return true;
            },
            COMMAND_PRIORITY_CRITICAL
        );
    }, [editor]);

    const handleBold = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
    const handleItalic = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
    const handleUnderline = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");

    const handleFontSizeChange = (e) => {
        const size = e.target.value;
        editor.dispatchCommand(SET_FONT_SIZE_COMMAND, size);
    };

    return (
        <div className="lexical-toolbar flex space-x-2 border-b pb-2 mb-2">
            <button onClick={handleBold} className="toolbar-btn">B</button>
            <button onClick={handleItalic} className="toolbar-btn">I</button>
            <button onClick={handleUnderline} className="toolbar-btn">U</button>

            {/* Text Size Dropdown */}
            <select onChange={handleFontSizeChange} className="toolbar-select">
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
                <option value="32px">32px</option>
            </select>
        </div>
    );
}
