"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const SIZE = 4;

function emptyBoard(): number[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandomTile(board: number[][]): number[][] {
  const empty: [number, number][] = [];
  board.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell === 0) empty.push([r, c]);
    })
  );
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = value;
  return newBoard;
}

function transpose(board: number[][]): number[][] {
  return board[0].map((_, i) => board.map(row => row[i]));
}

function reverse(board: number[][]): number[][] {
  return board.map(row => [...row].reverse());
}

function slide(row: number[]): { newRow: number[]; score: number } {
  const filtered = row.filter(v => v !== 0);
  const merged: number[] = [];
  let score = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2;
      merged.push(val);
      score += val;
      i++; // skip next
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return { newRow: merged, score };
}

function move(board: number[][], dir: "up" | "down" | "left" | "right"): { board: number[][]; score: number } {
  let rotated = board;
  if (dir === "up") {
    rotated = transpose(board);
  } else if (dir === "down") {
    rotated = reverse(transpose(board));
  } else if (dir === "right") {
    rotated = reverse(board);
  } else {
    rotated = board;
  }

  let totalScore = 0;
  const newRows = rotated.map(row => {
    const { newRow, score } = slide(row);
    totalScore += score;
    return newRow;
  });

  let result = newRows;
  if (dir === "up") {
    result = transpose(result);
  } else if (dir === "down") {
    result = reverse(transpose(result));
  } else if (dir === "right") {
    result = reverse(result);
  }

  return { board: result, score: totalScore };
}

function hasMoves(board: number[][]): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

export function Game2048() {
  const [board, setBoard] = useState<number[][]>(() => {
    let b = emptyBoard();
    b = addRandomTile(b);
    b = addRandomTile(b);
    return b;
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const handleMove = (dir: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    const { board: newBoard, score: delta } = move(board, dir);
    if (JSON.stringify(newBoard) === JSON.stringify(board)) return; // no change
    const finalBoard = addRandomTile(newBoard);
    setBoard(finalBoard);
    setScore(prev => prev + delta);
    if (finalBoard.some(row => row.includes(2048))) setWon(true);
    if (!hasMoves(finalBoard)) setGameOver(true);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          handleMove("up");
          break;
        case "ArrowDown":
          handleMove("down");
          break;
        case "ArrowLeft":
          handleMove("left");
          break;
        case "ArrowRight":
          handleMove("right");
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [board, gameOver]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((cell, idx) => (
          <div
            key={idx}
            className="w-16 h-16 flex items-center justify-center border rounded-md bg-muted"
          >
            {cell !== 0 && (
              <span className="text-2xl font-bold">{cell}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          <Button onClick={() => handleMove("up")}>↑</Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleMove("left")}>←</Button>
          <Button onClick={() => handleMove("right")}>→</Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleMove("down")}>↓</Button>
        </div>
      </div>
      <div className="text-xl">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-lg font-semibold">
            {won ? "You won!" : "Game Over"}
          </div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
