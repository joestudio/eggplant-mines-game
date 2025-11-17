import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Timer, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

const GRID_SIZE = 10;
const EGGPLANT_COUNT = 15;

type CellState = {
  isEggplant: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentEggplants: number;
};

type GameStatus = "playing" | "won" | "lost";

const Memesweeper = () => {
  const [grid, setGrid] = useState<CellState[][]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [timer, setTimer] = useState(0);
  const [flagsRemaining, setFlagsRemaining] = useState(EGGPLANT_COUNT);

  const initializeGrid = useCallback(() => {
    const newGrid: CellState[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({
            isEggplant: false,
            isRevealed: false,
            isFlagged: false,
            adjacentEggplants: 0,
          }))
      );

    // Place eggplants randomly
    let eggplantsPlaced = 0;
    while (eggplantsPlaced < EGGPLANT_COUNT) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      if (!newGrid[row][col].isEggplant) {
        newGrid[row][col].isEggplant = true;
        eggplantsPlaced++;
      }
    }

    // Calculate adjacent eggplants
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!newGrid[row][col].isEggplant) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = row + dr;
              const newCol = col + dc;
              if (
                newRow >= 0 &&
                newRow < GRID_SIZE &&
                newCol >= 0 &&
                newCol < GRID_SIZE &&
                newGrid[newRow][newCol].isEggplant
              ) {
                count++;
              }
            }
          }
          newGrid[row][col].adjacentEggplants = count;
        }
      }
    }

    setGrid(newGrid);
    setGameStatus("playing");
    setTimer(0);
    setFlagsRemaining(EGGPLANT_COUNT);
  }, []);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  useEffect(() => {
    if (gameStatus === "playing") {
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStatus]);

  const revealCell = useCallback(
    (row: number, col: number) => {
      if (gameStatus !== "playing" || grid[row][col].isFlagged) return;

      const newGrid = grid.map((r) => r.map((c) => ({ ...c })));

      const reveal = (r: number, c: number) => {
        if (
          r < 0 ||
          r >= GRID_SIZE ||
          c < 0 ||
          c >= GRID_SIZE ||
          newGrid[r][c].isRevealed ||
          newGrid[r][c].isFlagged
        ) {
          return;
        }

        newGrid[r][c].isRevealed = true;

        if (newGrid[r][c].isEggplant) {
          setGameStatus("lost");
          // Reveal all eggplants
          newGrid.forEach((row) => {
            row.forEach((cell) => {
              if (cell.isEggplant) cell.isRevealed = true;
            });
          });
          return;
        }

        if (newGrid[r][c].adjacentEggplants === 0) {
          // Recursively reveal adjacent cells
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              reveal(r + dr, c + dc);
            }
          }
        }
      };

      reveal(row, col);
      setGrid(newGrid);

      // Check for win
      const allNonEggplantsRevealed = newGrid.every((row) =>
        row.every((cell) => cell.isEggplant || cell.isRevealed)
      );
      if (allNonEggplantsRevealed) {
        setGameStatus("won");
      }
    },
    [grid, gameStatus]
  );

  const toggleFlag = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      e.preventDefault();
      if (gameStatus !== "playing" || grid[row][col].isRevealed) return;

      const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
      newGrid[row][col].isFlagged = !newGrid[row][col].isFlagged;
      setGrid(newGrid);
      setFlagsRemaining((prev) => prev + (newGrid[row][col].isFlagged ? -1 : 1));
    },
    [grid, gameStatus]
  );

  const getCellColor = (count: number) => {
    const colors = [
      "",
      "text-blue-600 dark:text-blue-400",
      "text-green-600 dark:text-green-400",
      "text-red-600 dark:text-red-400",
      "text-purple-600 dark:text-purple-400",
      "text-orange-600 dark:text-orange-400",
      "text-cyan-600 dark:text-cyan-400",
      "text-pink-600 dark:text-pink-400",
      "text-yellow-600 dark:text-yellow-400",
    ];
    return colors[count] || "";
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#008080]">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="bg-primary text-primary-foreground px-4 py-2 win95-outset inline-block mb-3">
            <h1 className="text-3xl font-jersey tracking-wider">
              MEMESWEEPER
            </h1>
          </div>
          <p className="text-foreground text-sm font-jersey">
            Find all the 🍆 without clicking on them!
          </p>
        </div>

        <div className="bg-card win95-outset p-3">
          {/* Game Stats */}
          <div className="flex justify-between items-center mb-4 gap-2">
            <div className="flex items-center gap-2 bg-input win95-inset px-3 py-2">
              <span className="font-bold text-destructive text-2xl">🚩</span>
              <span className="font-jersey text-lg tabular-nums">{flagsRemaining.toString().padStart(3, '0')}</span>
            </div>

            {gameStatus !== "playing" && (
              <button
                onClick={initializeGrid}
                className="bg-card win95-button px-4 py-2 font-jersey hover:bg-muted active:bg-accent transition-colors text-sm"
              >
                Start Over
              </button>
            )}

            <div className="flex items-center gap-2 bg-input win95-inset px-3 py-2">
              <span className="font-jersey text-lg tabular-nums">{timer.toString().padStart(3, '0')}</span>
              <span className="font-bold text-2xl">⏱️</span>
            </div>
          </div>

          {/* Game Status */}
          {gameStatus !== "playing" && (
            <div className="text-center mb-4">
              <div
                className={cn(
                  "inline-block px-6 py-3 win95-outset text-xl font-jersey",
                  gameStatus === "won"
                    ? "bg-primary text-primary-foreground"
                    : "bg-destructive text-destructive-foreground"
                )}
              >
                {gameStatus === "won" ? "🎉 You Won!" : "💥 Game Over!"}
              </div>
            </div>
          )}

          {/* Grid */}
          <div
            className="grid bg-card win95-inset p-1"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              gap: "0px"
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => revealCell(rowIndex, colIndex)}
                  onContextMenu={(e) => toggleFlag(rowIndex, colIndex, e)}
                  disabled={gameStatus !== "playing"}
                  className={cn(
                    "aspect-square flex items-center justify-center text-sm sm:text-base font-jersey transition-none",
                    "focus:outline-none",
                    cell.isRevealed
                      ? cell.isEggplant
                        ? "bg-destructive text-destructive-foreground text-2xl"
                        : "bg-game-cell-revealed text-foreground border border-win95-dark"
                      : "bg-game-cell win95-button cursor-pointer hover:bg-game-cell-hover"
                  )}
                >
                  {cell.isRevealed ? (
                    cell.isEggplant ? (
                      "🍆"
                    ) : cell.adjacentEggplants > 0 ? (
                      <span className={getCellColor(cell.adjacentEggplants)}>
                        {cell.adjacentEggplants}
                      </span>
                    ) : null
                  ) : cell.isFlagged ? (
                    <span className="text-2xl">🚩</span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="text-center mt-4 bg-card win95-outset px-3 py-2 inline-block">
          <p className="text-foreground text-xs font-jersey">Left click to reveal • Right click to flag</p>
        </div>
      </div>
    </div>
  );
};

export default Memesweeper;
