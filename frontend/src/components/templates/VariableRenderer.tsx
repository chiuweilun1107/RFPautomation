"use client"

import * as React from "react"

interface VariableRendererProps {
  text?: string
}

// 識別變數的正則表達式
const VARIABLE_REGEX = /\{([^}]+)\}/g

export function VariableRenderer({ text }: VariableRendererProps) {
  // Handle undefined or empty text
  if (!text) return null

  // 分割文字，識別變數
  const parts = text.split(VARIABLE_REGEX)
  const matches = text.match(VARIABLE_REGEX) || []

  return (
    <>
      {parts.map((part, index) => {
        // 檢查這個部分是否是變數
        const isVariable = matches.some(match => match === `{${part}}`)
        
        if (isVariable) {
          return (
            <span
              key={index}
              className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-mono text-sm font-semibold border border-blue-300 dark:border-blue-700 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              title={`變數: ${part}`}
            >
              {part}
            </span>
          )
        }
        
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

// 輔助函數：從文字中提取所有變數
export function extractVariables(text: string): string[] {
  const matches = text.match(VARIABLE_REGEX) || []
  return matches.map(match => match.slice(1, -1)) // 移除大括號
}

// 輔助函數：替換文字中的變數
export function replaceVariables(text: string, variables: Record<string, string>): string {
  return text.replace(VARIABLE_REGEX, (match, variableName) => {
    return variables[variableName] !== undefined ? variables[variableName] : match
  })
}