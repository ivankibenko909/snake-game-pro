import { useState, useEffect, useCallback, useRef } from 'react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 50;

function App() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('snakeHighScore') || '0');
  });
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const directionRef = useRef<Direction>(direction);
  const gameLoopRef = useRef<number | null>(null);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = () => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setGameStarted(true);
    setSpeed(INITIAL_SPEED);
  };

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      const currentDir = directionRef.current;

      switch (currentDir) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Проверка столкновения со стенами
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        return prevSnake;
      }

      // Проверка столкновения с собой
      if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Проверка поедания еды
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snakeHighScore', newScore.toString());
          }
          return newScore;
        });
        setFood(generateFood(newSnake));
        // Увеличиваем скорость каждые 50 очков
        setSpeed(prev => Math.max(50, prev - 5));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, generateFood, highScore]);

  // Игровой цикл
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      gameLoopRef.current = window.setInterval(moveSnake, speed);
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, isPaused, moveSnake, speed]);

  // Управление клавиатурой
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (gameOver) {
          resetGame();
        } else if (gameStarted) {
          setIsPaused(prev => !prev);
        } else {
          setGameStarted(true);
        }
        return;
      }

      if (!gameStarted || gameOver || isPaused) return;

      const currentDir = directionRef.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          if (currentDir !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          if (currentDir !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          if (currentDir !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          if (currentDir !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver, isPaused]);

  // Мобильное управление
  const handleDirectionButton = (newDir: Direction) => {
    if (!gameStarted || gameOver || isPaused) return;
    const currentDir = directionRef.current;
    if (
      (newDir === 'UP' && currentDir !== 'DOWN') ||
      (newDir === 'DOWN' && currentDir !== 'UP') ||
      (newDir === 'LEFT' && currentDir !== 'RIGHT') ||
      (newDir === 'RIGHT' && currentDir !== 'LEFT')
    ) {
      setDirection(newDir);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center p-4">
      {/* Заголовок */}
      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-4">
        🐍 Змейка
      </h1>

      {/* Счёт */}
      <div className="flex gap-6 mb-4 text-white">
        <div className="bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-green-500/30">
          <span className="text-green-400 font-semibold">Счёт: </span>
          <span className="text-xl font-bold">{score}</span>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-yellow-500/30">
          <span className="text-yellow-400 font-semibold">Рекорд: </span>
          <span className="text-xl font-bold">{highScore}</span>
        </div>
      </div>

      {/* Игровое поле */}
      <div className="relative">
        <div
          className="border-2 border-green-500/50 rounded-lg bg-gray-900/80 backdrop-blur-sm shadow-2xl shadow-green-500/20"
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
          }}
        >
          {/* Сетка */}
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);
            const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
            const isSnakeBody = snake.slice(1).some(s => s.x === x && s.y === y);
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={index}
                className={`absolute rounded-sm transition-all duration-75 ${
                  isSnakeHead
                    ? 'bg-green-400 shadow-lg shadow-green-400/50 scale-110'
                    : isSnakeBody
                    ? 'bg-green-500/80'
                    : isFood
                    ? 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse rounded-full'
                    : ''
                }`}
                style={{
                  left: x * CELL_SIZE,
                  top: y * CELL_SIZE,
                  width: CELL_SIZE - 1,
                  height: CELL_SIZE - 1,
                }}
              />
            );
          })}

          {/* Оверлей начала/конца игры */}
          {(!gameStarted || gameOver) && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
              {gameOver ? (
                <>
                  <p className="text-3xl font-bold text-red-400 mb-2">Игра окончена!</p>
                  <p className="text-xl text-white mb-4">Счёт: {score}</p>
                  <button
                    onClick={resetGame}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-400 hover:to-emerald-500 transition-all transform hover:scale-105 shadow-lg"
                  >
                    Играть снова
                  </button>
                  <p className="text-gray-400 mt-3 text-sm">или нажмите Пробел</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-green-400 mb-4">Готовы играть?</p>
                  <button
                    onClick={() => setGameStarted(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-400 hover:to-emerald-500 transition-all transform hover:scale-105 shadow-lg"
                  >
                    Начать игру
                  </button>
                  <p className="text-gray-400 mt-3 text-sm">или нажмите Пробел</p>
                </>
              )}
            </div>
          )}

          {/* Пауза */}
          {isPaused && gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <p className="text-3xl font-bold text-yellow-400">⏸ Пауза</p>
            </div>
          )}
        </div>
      </div>

      {/* Мобильное управление */}
      <div className="mt-6 md:hidden">
        <div className="grid grid-cols-3 gap-2 w-36 mx-auto">
          <div></div>
          <button
            onTouchStart={() => handleDirectionButton('UP')}
            className="w-12 h-12 bg-gray-700/80 rounded-lg flex items-center justify-center text-white text-xl active:bg-green-600 border border-gray-600"
          >
            ↑
          </button>
          <div></div>
          <button
            onTouchStart={() => handleDirectionButton('LEFT')}
            className="w-12 h-12 bg-gray-700/80 rounded-lg flex items-center justify-center text-white text-xl active:bg-green-600 border border-gray-600"
          >
            ←
          </button>
          <button
            onTouchStart={() => setIsPaused(prev => !prev)}
            className="w-12 h-12 bg-gray-700/80 rounded-lg flex items-center justify-center text-white text-sm active:bg-yellow-600 border border-gray-600"
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          <button
            onTouchStart={() => handleDirectionButton('RIGHT')}
            className="w-12 h-12 bg-gray-700/80 rounded-lg flex items-center justify-center text-white text-xl active:bg-green-600 border border-gray-600"
          >
            →
          </button>
          <div></div>
          <button
            onTouchStart={() => handleDirectionButton('DOWN')}
            className="w-12 h-12 bg-gray-700/80 rounded-lg flex items-center justify-center text-white text-xl active:bg-green-600 border border-gray-600"
          >
            ↓
          </button>
          <div></div>
        </div>
      </div>

      {/* Управление */}
      <div className="mt-4 text-center">
        <p className="text-gray-400 text-sm">
          Управление: <span className="text-green-400">WASD</span> или <span className="text-green-400">стрелки</span> | Пауза: <span className="text-green-400">Пробел</span>
        </p>
      </div>

      {/* Кнопка паузы для десктопа */}
      {gameStarted && !gameOver && (
        <button
          onClick={() => setIsPaused(prev => !prev)}
          className="mt-3 px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 transition-all border border-gray-600 hidden md:block"
        >
          {isPaused ? '▶ Продолжить' : '⏸ Пауза'}
        </button>
      )}
    </div>
  );
}

export default App;
