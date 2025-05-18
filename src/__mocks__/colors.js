// Mock implementation of the colors package
// This simplifies testing and avoids potential dependency issues

const addColor = (color) => {
  return (text) => `[${color.toUpperCase()}]${text}`;
};

const colors = {};

// Define color methods
const colorNames = [
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray', 'grey',
  'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite'
];

// Add text colors
colorNames.forEach(color => {
  colors[color] = addColor(color);
  // Add as prototype method to String
  String.prototype[color] = function() {
    return colors[color](this);
  };
});

// Add background colors
colorNames.forEach(color => {
  const bgColor = `bg${color.charAt(0).toUpperCase() + color.slice(1)}`;
  colors[bgColor] = addColor(bgColor);
  // Add as prototype method to String
  String.prototype[bgColor] = function() {
    return colors[bgColor](this);
  };
});

// Add style methods
const styles = ['reset', 'bold', 'dim', 'italic', 'underline', 'inverse', 'hidden', 'strikethrough'];
styles.forEach(style => {
  colors[style] = addColor(style);
  // Add as prototype method to String
  String.prototype[style] = function() {
    return colors[style](this);
  };
});

// Commonly used theme methods
colors.setTheme = function(theme) {
  for (const name in theme) {
    if (theme.hasOwnProperty(name)) {
      const color = theme[name];
      colors[name] = colors[color] || addColor(color);
      // Add as prototype method to String
      String.prototype[name] = function() {
        return colors[name](this);
      };
    }
  }
};

// Safe mode flag
colors.enabled = true;
colors.enable = () => { colors.enabled = true; };
colors.disable = () => { colors.enabled = false; };

module.exports = colors; 