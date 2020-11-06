# Ant Design Pro 的 多 Tab 版本

这个项目是基于 [Ant Design Pro](https://pro.ant.design) 的 多 tab 版本.

## 背景

1. 官方不支持多 tab。

2. 其他的实现的多 tab 侵入性很强，要改的地方很多。这个版本，把多 tab 封装成组件在 components/TabPages 下，直接在 BasicLayout 引入即可。其余的使用，例如打开新页面、替换当前页面都没有改变。

3. 本多 tab 实现了右键菜单，包含刷新 tab、关闭其他页面的功能。

## 优点

## 常见使用场景

### 关闭当前 tab

```tsx
history.push({ state: { closed: true } });
```

### 替换当前 tab

```tsx
history.replace('/a/b/c');
```

### 关闭当前页面，并跳转指定 tab

```tsx
history.push({ pathname: '/a/b/c', state: { closed: true } });
```

## Environment Prepare

Install `node_modules`:

```bash
npm install
```

or

```bash
yarn
```

## Provided Scripts

Ant Design Pro provides some useful script to help you quick start and build with web project, code style check and test.

Scripts provided in `package.json`. It's safe to modify or add additional script:

### Start project

```bash
npm start
```

### Build project

```bash
npm run build
```

### Check code style

```bash
npm run lint
```

You can also use script to auto fix some lint error:

```bash
npm run lint:fix
```

### Test code

```bash
npm test
```

## More

You can view full document on our [official website](https://pro.ant.design). And welcome any feedback in our [github](https://github.com/ant-design/ant-design-pro).
