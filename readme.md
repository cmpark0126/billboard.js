## Description

본 프로젝트의 목표는 웹에서 차트를 구현하기 위해 제공되는 `billboard.js` 오픈소스 라이브러리의
기능을 확장하여 신규 릴리즈 단계까지 진행하는 것이다. 
구체적으로 우리는 프로젝트에서 (1) 현재 라이브러리가 지원하지 않는 차트를 구현하여 라이브러리에 추가하고, 
(2) 구현한 내용을 실제코드에 merge하여 신규 릴리즈 단계까지 진행시키고자 한다.

## Prerequisite
https://github.com/naver/billboard.js/blob/master/README.md
- Billboard.js 의 Download and Installation 를 참고하여 설치를 진행해주시면 됩니다.

## Files
- 기존 billboard.js에서 추가하거나 수정한 파일들입니다.
### demo/
### src/ChartInternal/shape/polar.ts
### src/ChartInternal/internals/transform.ts
### src/config/Options/shape/polar.ts
### src/scss/billboard.scss

## Basic usage example

#### 1) Create chart holder element
```html
<div id="chart"></div>
```

#### 2) Generate a chart with options
```js
// generate the chart
var chart = bb.generate({
    data: {
      columns: [
          ["data1", 30],
          ["data2", 120],
          ["data3", 75]
      ],
      type: "polar",  // for ESM specify as: polar()
      label: true
    },
    polar: {
      level: {
        depth: 4
      },
      size: {
        max: 200
      }
    },
    bindto: "#polarChart"
});
// call some API
chart.load( ... );
```
## Example
![image](https://user-images.githubusercontent.com/52646601/145227273-7d081e4c-727b-4634-b938-c3be5cbd8cdb.png)
