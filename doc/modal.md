# Работа с модальными окнами

Для работы с модальными окнами нужно использовать сервис ModalService.

## Открытие модального окна

1. Заинжектить в компонент службу
```
constructor(private modalService: ModalService) { }
```
2. В шаблоне компонента создать шаблон контента модалки, без заголовка и кнопки закрытия (они уже будут)
```angular2html
<ng-template #templateName>
  Some Modal Content
</ng-template>
```
3. В шаблон передаётся автоматически функция закрытия модалки, а также данные, переданные при вызове modalService.open в последнем аргументе. Использовать можно так:
```angular2html
<ng-template #templateName let-close="close" let-data="data">
  Some Modal Content {{data.value}}
  <button (click)="close()"></button>
</ng-template>
```   
4. Добавить в класс компонента ссылку на этот темплейт
```
@ViewChild("templateName") template: TemplateRef<any>
```
5. В нужном методе вызвать модалку
```
modalRef = this.modalService.open(
  /* Шаблон модалки. Может также принимать строку и компонент, но обычно удобно именно TemplateRef использовать */
  this.template, 
  /* Конфиг модалки. См. ниже */
  {
    width: "400px",
    height: "400px",
  }, 
  /* Данные, которые будут переданы в шаблон
  {}
)
```
6. При необходимости можно подписаться на закрытие подалки:
```
modalRef.afterClosed$.subscribe((data) => {
    /* Do something */
});
```
7. В функцию close при необходимости можно передавать данные, которые получит наблюдатель по подписке
```angular2html
<ng-template #templateName let-close="close" let-data="data">
  Some Modal Content {{data.value}}
  <button (click)="close('YES')"></button>
</ng-template>
```

## Параметры, которые передаются при открытии модалки

Все параметры являются необязательными, но нужно передать либо ширину и высоту,
либо доп класс

<table>
  <tr>
    <th>width</th>
    <td>Ширина в строковом виде, вместе с ед. измерения, например "100px" или "30vh"</td>
  </tr>
  <tr>
    <th>height</th>
    <td>Высота в строковом виде, вместе с ед. измерения, например "100px" или "30vh"</td>
  </tr>
  <tr>
    <th>maxWidth</th>
    <td>Макс. ширина в строковом виде, вместе с ед. измерения, например "100px" или "30vh"</td>
  </tr>
  <tr>
    <th>maxHeight</th>
    <td>Макс. высота в строковом виде, вместе с ед. измерения, например "100px" или "30vh"</td>
  </tr>
  <tr>
    <th>title</th>
    <td>Заголовок. Будет подтавлен автоматом в модалку, окружённый тегом header. <i>В данном проекте не стилизован</i></td>
  </tr>
  <tr>
    <th>dlgClass</th> 
    <td>Дополнительный класс для модалки. Позволяет делать более сложные вещи, например, задавать разные размеры для разных разрешений. Сам класс должен быть описан / включён в глобальный файл стилей</td>
  </tr>
</table>

## Технические детали
Модалки реализованы на основе Angular CDK, [модуля Overlay](https://material.angular.io/cdk/overlay/overview). Идея и большая часть реализации взята из статьи
[How to build a reusable Modal Overlay/Dialog Using Angular CDK](https://codinglatte.com/posts/angular/reusable-modal-overlay-using-angular-cdk-overlay/)
