(function () {
  'use strict';

  // ---- Ícones SVG originais extraídos da página dos Correios ----
  // Cada tipo de evento usa o ícone exato do HTML original.

  var ICONE = {
    ENTREGUE:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQyIDI5Ljc4NTRWMTYuMjM2MUM0MiAxNS40Nzg1IDQxLjU3MiAxNC43ODYgNDAuODk0NCAxNC40NDcyTDI0Ljg5NDQgNi40NDcyMUMyNC4zMzE0IDYuMTY1NjkgMjMuNjY4NiA2LjE2NTY5IDIzLjEwNTYgNi40NDcyMUw3LjEwNTU3IDE0LjQ0NzJDNi40MjggMTQuNzg2IDYgMTUuNDc4NSA2IDE2LjIzNjFWMzEuNzYzOUM2IDMyLjUyMTUgNi40MjggMzMuMjE0IDcuMTA1NTcgMzMuNTUyOEwyMy4xMTU4IDQxLjU1NzlDMjMuNjczMSA0MS44MzY1IDI0LjMyODQgNDEuODM5NSAyNC44ODgyIDQxLjU2NkwyOS44NTI4IDM5LjE0MDIiIHN0cm9rZT0iIzNGM0UzQiIvPgo8cGF0aCBkPSJNMjQgNDJWMjQuNDVNMjQgMjQuNDVMNiAxNU0yNCAyNC40NUw0MiAxNSIgc3Ryb2tlPSIjM0YzRTNCIi8+CjxwYXRoIGQ9Ik0xMyAxMS43MjczTDMwLjY5MjMgMjAuODE4MlYyNy4zNjE5QzMwLjY5MjMgMjguMTEwMSAzMS40ODM5IDI4LjU5MzMgMzIuMTQ5MyAyOC4yNTEzTDM0LjkxNDEgMjYuODMwN0MzNS41ODA4IDI2LjQ4ODEgMzYgMjUuODAxNCAzNiAyNS4wNTE4VjE4LjA5MDlMMTguMzA3NyA5IiBzdHJva2U9IiMzRjNFM0IiLz4KPHBhdGggZD0iTTkgMzAuMzgyVjI2LjgwOUM5IDI2LjQzNzMgOS4zOTExNiAyNi4xOTU2IDkuNzIzNjEgMjYuMzYxOEwxMy40NDcyIDI4LjIyMzZDMTMuNzg2IDI4LjM5MyAxNCAyOC43MzkzIDE0IDI5LjExOFYzMi42OTFDMTQgMzMuMDYyNyAxMy42MDg4IDMzLjMwNDQgMTMuMjc2NCAzMy4xMzgyTDkuNTUyNzkgMzEuMjc2NEM5LjIxNCAzMS4xMDcgOSAzMC43NjA3IDkgMzAuMzgyWiIgc3Ryb2tlPSIjM0YzRTNCIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTMyLjcxNzcgMzcuNTg5NUwzMy4wNzEyIDM3Ljk0M0wzMy40MjQ4IDM3LjU4OTVMNDAuOTM1MiAzMC4wNzlDNDEuNTIxIDI5LjQ5MzMgNDIuNDcwNyAyOS40OTMzIDQzLjA1NjUgMzAuMDc5QzQzLjY0MjMgMzAuNjY0OCA0My42NDIzIDMxLjYxNDYgNDMuMDU2NSAzMi4yMDA0TDMzLjQyNDggNDEuODMyMUMzMy4yMjk1IDQyLjAyNzQgMzIuOTEyOSA0Mi4wMjc0IDMyLjcxNzcgNDEuODMyMUwyOC4wMzE0IDM3LjE0NTlDMjcuNDQ1NiAzNi41NjAxIDI3LjQ0NTYgMzUuNjEwNCAyOC4wMzE0IDM1LjAyNDZDMjguNjE3MiAzNC40Mzg4IDI5LjU2NjkgMzQuNDM4OCAzMC4xNTI3IDM1LjAyNDZMMzIuNzE3NyAzNy41ODk1WiIgc3Ryb2tlPSIjM0YzRTNCIi8+Cjwvc3ZnPgo=',

    SAIU_ENTREGA:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMyLjUgMzZIMjhIMjlDMzAuMTA0NiAzNiAzMSAzNS4xMDQ2IDMxIDM0VjE2SDM4LjQxNDZDMzguODEwOCAxNiAzOS4xOTkxIDE2LjEwNjEgMzkuNTM2MiAxNi4zMDYzQzM5Ljg3MzIgMTYuNTA2NiA0MC4xNDU3IDE2Ljc5MzEgNDAuMzIyOSAxNy4xMzM4TDQzLjc3NDUgMjMuNzcxOUM0My45MjI4IDI0LjA1NjcgNDQuMDAwMSAyNC4zNzA5IDQ0IDI0LjY4OTRWMjhNMzkuNSAzNkg0MS44NjY3QzQyLjQzMjUgMzYgNDIuOTc1MSAzNS43ODM5IDQzLjM3NTIgMzUuMzk5MkM0My43NzUyIDM1LjAxNDUgNDQgMzQuNDkyOCA0NCAzMy45NDg3VjMyIiBzdHJva2U9IiMzRjNFM0IiLz4KPHBhdGggZD0iTTE1LjUgMzZIMjkuMDM2NEMyOS41NTcyIDM2IDMwLjA1NjYgMzUuNzg1NSAzMC40MjQ5IDM1LjQwMzZDMzAuNzkzMSAzNS4wMjE3IDMxIDM0LjUwMzcgMzEgMzMuOTYzNlYxMC4wMzY0QzMxIDkuNDk2MjkgMzAuNzkzMSA4Ljk3ODMzIDMwLjQyNDkgOC41OTY0NEMzMC4wNTY2IDguMjE0NTUgMjkuNTU3MiA4IDI5LjAzNjQgOEg1Ljk2MzY0QzUuNDQyODUgOCA0Ljk0MzM5IDguMjE0NTUgNC41NzUxNCA4LjU5NjQ0QzQuMjA2ODggOC45NzgzMyA0IDkuNDk2MjkgNCAxMC4wMzY0VjI4TTguNSAzNkg1Ljk2MzY0QzUuNDQyODUgMzYgNC45NDMzOSAzNS43ODU1IDQuNTc1MTQgMzUuNDAzNkM0LjIwNjg4IDM1LjAyMTcgNCAzNC41MDM3IDQgMzMuOTYzNlYzMiIgc3Ryb2tlPSIjM0YzRTNCIi8+CjxwYXRoIGQ9Ik0zOC4zODE4IDE4LjVMMzguMzgyIDE4LjVDMzguNDc0OCAxOC41IDM4LjU2NTggMTguNTI1OCAzOC42NDQ4IDE4LjU3NDdDMzguNzIzNyAxOC42MjM1IDM4Ljc4NzUgMTguNjkzNCAzOC44Mjg5IDE4Ljc3NjRMMzguODI5MSAxOC43NzY4TDQwLjgyOTEgMjIuNzc2OEw0MC44MjkyIDIyLjc3NjlDNDAuODY3MyAyMi44NTMgNDAuODg1MyAyMi45Mzc3IDQwLjg4MTQgMjMuMDIyOEM0MC44Nzc2IDIzLjEwNzkgNDAuODUyMSAyMy4xOTA2IDQwLjgwNzMgMjMuMjYzMUM0MC43NjI1IDIzLjMzNTYgNDAuNjk5OSAyMy4zOTU0IDQwLjYyNTUgMjMuNDM2OEM0MC41NTEgMjMuNDc4MyA0MC40NjczIDIzLjUgNDAuMzgyMSAyMy41SDQwLjM4MThIMzQuNUMzNC4zNjc0IDIzLjUgMzQuMjQwMiAyMy40NDczIDM0LjE0NjQgMjMuMzUzNkMzNC4wNTI3IDIzLjI1OTggMzQgMjMuMTMyNiAzNCAyM1YxOUMzNCAxOC44Njc0IDM0LjA1MjcgMTguNzQwMiAzNC4xNDY0IDE4LjY0NjRDMzQuMjQwMiAxOC41NTI3IDM0LjM2NzQgMTguNSAzNC41IDE4LjVIMzguMzgxOFoiIHN0cm9rZT0iIzNGM0UzQiIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTM3IDM2QzM3IDM1LjgwMjIgMzYuOTQxNCAzNS42MDg5IDM2LjgzMTUgMzUuNDQ0NEMzNi43MjE2IDM1LjI4IDM2LjU2NTQgMzUuMTUxOCAzNi4zODI3IDM1LjA3NjFDMzYuMiAzNS4wMDA0IDM1Ljk5ODkgMzQuOTgwNiAzNS44MDQ5IDM1LjAxOTJDMzUuNjEwOSAzNS4wNTc4IDM1LjQzMjcgMzUuMTUzIDM1LjI5MjkgMzUuMjkyOUMzNS4xNTMgMzUuNDMyNyAzNS4wNTc4IDM1LjYxMDkgMzUuMDE5MiAzNS44MDQ5QzM0Ljk4MDYgMzUuOTk4OSAzNS4wMDA0IDM2LjIgMzUuMDc2MSAzNi4zODI3QzM1LjE1MTggMzYuNTY1NCAzNS4yOCAzNi43MjE2IDM1LjQ0NDQgMzYuODMxNUMzNS42MDg5IDM2Ljk0MTQgMzUuODAyMiAzNyAzNiAzN0MzNi4yNjUyIDM3IDM2LjUxOTYgMzYuODk0NiAzNi43MDcxIDM2LjcwNzFDMzYuODk0NiAzNi41MTk2IDM3IDM2LjI2NTIgMzcgMzZaIiBzdHJva2U9IiMzRjNFM0IiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMyAzNkMxMyAzNS44MDIyIDEyLjk0MTQgMzUuNjA4OSAxMi44MzE1IDM1LjQ0NDRDMTIuNzIxNiAzNS4yOCAxMi41NjU0IDM1LjE1MTggMTIuMzgyNyAzNS4wNzYxQzEyLjIgMzUuMDAwNCAxMS45OTg5IDM0Ljk4MDYgMTEuODA0OSAzNS4wMTkyQzExLjYxMDkgMzUuMDU3OCAxMS40MzI3IDM1LjE1MyAxMS4yOTI5IDM1LjI5MjlDMTEuMTUzIDM1LjQzMjcgMTEuMDU3OCAzNS42MTA5IDExLjAxOTIgMzUuODA0OUMxMC45ODA2IDM1Ljk5ODkgMTEuMDAwNCAzNi4yIDExLjA3NjEgMzYuMzgyN0MxMS4xNTE4IDM2LjU2NTQgMTEuMjggMzYuNzIxNiAxMS40NDQ0IDM2LjgzMTVDMTEuNjA4OSAzNi45NDE0IDExLjgwMjIgMzcgMTIgMzdDMTIuMjY1MiAzNyAxMi41MTk2IDM2Ljg5NDYgMTIuNzA3MSAzNi43MDcxQzEyLjg5NDYgMzYuNTE5NiAxMyAzNi4yNjUyIDEzIDM2WiIgc3Ryb2tlPSIjM0YzRTNCIi8+CjxwYXRoIGQ9Ik02IDMySDRDMy40NDc3MiAzMiAzIDMxLjU1MjMgMyAzMUwzIDI5QzMgMjguNDQ3NyAzLjQ0NzcyIDI4IDQgMjhINkM2LjU1MjI4IDI4IDcgMjguNDQ3NyA3IDI5TDcgMzFDNyAzMS41NTIzIDYuNTUyMjggMzIgNiAzMloiIHN0cm9rZT0iIzNGM0UzQiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik00NCAzMkg0MkM0MS40NDc3IDMyIDQxIDMxLjU1MjMgNDEgMzFWMjlDNDEgMjguNDQ3NyA0MS40NDc3IDI4IDQyIDI4SDQ0QzQ0LjU1MjMgMjggNDUgMjguNDQ3NyA0NSAyOVYzMUM0NSAzMS41NTIzIDQ0LjU1MjMgMzIgNDQgMzJaIiBzdHJva2U9IiMzRjNFM0IiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTEgMjNMMyAyMyIgc3Ryb2tlPSIjM0YzRTNCIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTEzIDE1TDMgMTUiIHN0cm9rZT0iIzNGM0UzQiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0xOCAxNUgxNiIgc3Ryb2tlPSIjM0YzRTNCIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTE2IDIzSDE0IiBzdHJva2U9IiMzRjNFM0IiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTYgMTlMNyAxOSIgc3Ryb2tlPSIjM0YzRTNCIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTQgMTlIMiIgc3Ryb2tlPSIjM0YzRTNCIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIzNiIgcj0iNCIgc3Ryb2tlPSIjM0YzRTNCIi8+CjxjaXJjbGUgY3g9IjM2IiBjeT0iMzYiIHI9IjQiIHN0cm9rZT0iIzNGM0UzQiIvPgo8L3N2Zz4K',

    POSTADO:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTExLjEwNTYgMzMuMDUyOEwyNi4xMDU2IDQwLjU1MjhDMjYuNjY4NiA0MC44MzQzIDI3LjMzMTQgNDAuODM0MyAyNy44OTQ0IDQwLjU1MjhMNDIuODk0NCAzMy4wNTI4QzQzLjU3MiAzMi43MTQgNDQgMzIuMDIxNSA0NCAzMS4yNjM5VjE2LjczNjFDNDQgMTUuOTc4NSA0My41NzIgMTUuMjg2IDQyLjg5NDQgMTQuOTQ3MkwyNy44OTQ0IDcuNDQ3MjFDMjcuMzMxNCA3LjE2NTY5IDI2LjY2ODYgNy4xNjU2OSAyNi4xMDU2IDcuNDQ3MjFMMTEuMTA1NiAxNC45NDcyQzEwLjQyOCAxNS4yODYgMTAgMTUuOTc4NSAxMCAxNi43MzYxVjMxLjI2MzlDMTAgMzIuMDIxNSAxMC40MjggMzIuNzE0IDExLjEwNTYgMzMuMDUyOFoiIHN0cm9rZT0iIzNGM0UzQiIvPgo8cGF0aCBkPSJNMjcgNDFWMjQuMU0yNyAyNC4xTDExIDE1LjVNMjcgMjQuMUw0MyAxNS41IiBzdHJva2U9IiMzRjNFM0IiLz4KPHBhdGggZD0iTTE2LjUgMTJMMzMuMTUzOCAyMC42MzY0VjI2LjM3MjZDMzMuMTUzOCAyNy4xMTgyIDMzLjk0MDUgMjcuNjAxNiAzNC42MDU3IDI3LjI2NDdMMzYuOTAzNyAyNi4xMDA3QzM3LjU3NjIgMjUuNzYwMSAzOCAyNS4wNzAzIDM4IDI0LjMxNjVWMTguMTgxOEwyMS41IDkuNSIgc3Ryb2tlPSIjM0YzRTNCIi8+CjxwYXRoIGQ9Ik0xNSAyMkw1IDIyIiBzdHJva2U9IiMzRjNFM0IiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTUgMzBMNyAzMCIgc3Ryb2tlPSIjM0YzRTNCIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTE4IDI2TDkgMjYiIHN0cm9rZT0iIzNGM0UzQiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik02IDI2SDQiIHN0cm9rZT0iIzNGM0UzQiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo=',

    ETIQUETA:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQwIDMwLjVWMTJDNDAgOS43OTA4NiAzOC4yMDkxIDggMzYgOEg4QzUuNzkwODYgOCA0IDkuNzkwODYgNCAxMlYzNkM0IDM4LjIwOTEgNS43OTA4NiA0MCA4IDQwSDMzTTM0LjUgNDBIMzZDMzguMjA5MSA0MCA0MCAzOC4yMDkxIDQwIDM2VjM0LjUiIHN0cm9rZT0iYmxhY2siLz4KPHBhdGggZD0iTTkgMjJWMzYiIHN0cm9rZT0iYmxhY2siLz4KPHBhdGggZD0iTTE5IDIyVjM2IiBzdHJva2U9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0zMSAyMlYzNCIgc3Ryb2tlPSJibGFjayIvPgo8cGF0aCBkPSJNMTIgMjJWMzYiIHN0cm9rZT0iYmxhY2siLz4KPHBhdGggZD0iTTIyIDIyVjM2IiBzdHJva2U9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0zNCAyMlYzNiIgc3Ryb2tlPSJibGFjayIvPgo8cGF0aCBkPSJNMTUgMjJWMzYiIHN0cm9rZT0iYmxhY2siLz4KPHBhdGggZD0iTTI1IDIyVjM2IiBzdHJva2U9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0zMCAyMlYzMyIgc3Ryb2tlPSJibGFjayIvPgo8cGF0aCBkPSJNMTYgMjJWMzYiIHN0cm9rZT0iYmxhY2siLz4KPHBhdGggZD0iTTM1IDIyVjM1LjUiIHN0cm9rZT0iYmxhY2siLz4KPHBhdGggZD0iTTI2IDIyVjM2IiBzdHJva2U9ImJsYWNrIi8+CjxwYXRoIGQ9Ik0xMy4yMzEzIDExLjYyODlDMTMuMjMxMyAxMS4yODEzIDEyLjk1IDExLjAwMDUgMTIuNjAzMSAxMS4wMDA1TDggMTEuMDAwOUwxMC45NDQ2IDE0Ljc2OTNMMTMuMTIyNCAxMS45ODE5QzEzLjE5MTIgMTEuODgxNCAxMy4yMzEzIDExLjc2MDMgMTMuMjMxMyAxMS42Mjg5IiBmaWxsPSJibGFjayIvPgo8cGF0aCBkPSJNMTcuMTI2IDE0LjcyOTlWMTQuNzI4NUwxNC42MzUgMTEuNTUxMkMxNC40MDM2IDExLjIzMDEgMTQuMDMyMiAxMS4wMTgxIDEzLjYwOTggMTEuMDAzM1YxMUMxMy42MDk4IDExIDEzLjYwOTggMTEgMTMuNjA5OCAxMUMxNC4zMDM1IDExLjQxNjMgMTMuODA4IDEyLjA0MjcgMTMuODA4IDEyLjA0MjdIMTMuODA4MUwxMS40OTQ4IDE1LjAwMjlMMTEuNDkyNSAxNC45OTkxTDguMzY3OCAxOC45OTcxTDEzLjI2MTEgMTlMMTMuNjI1NSAxOC45ODcyQzE0LjAyMDcgMTguOTY5OCAxNC4zNzE2IDE4Ljc4IDE0LjYwMzIgMTguNDg5NkwxNC42MDc3IDE4LjQ4NjhMMTcuMTE0OSAxNS4yNzk0VjE1LjI3NjVDMTcuMTc1OSAxNS4xOTkxIDE3LjIxMzggMTUuMTAyOCAxNy4yMTM4IDE0Ljk5N0MxNy4yMTM4IDE0Ljg5NjkgMTcuMTgwOCAxNC44MDU4IDE3LjEyNiAxNC43Mjk5IiBmaWxsPSJibGFjayIvPgo8Y2lyY2xlIGN4PSIzMiIgY3k9IjE1IiByPSIyLjUiIHN0cm9rZT0iYmxhY2siLz4KPHBhdGggZD0iTTMzLjQ1NCAzNi4yNzgyTDMzLjgwNzYgMzYuNjMxOEwzNC4xNjExIDM2LjI3ODJMNDEuNjcxNiAyOC43Njc4QzQyLjI1NzMgMjguMTgyIDQzLjIwNzEgMjguMTgyIDQzLjc5MjkgMjguNzY3OEM0NC4zNzg3IDI5LjM1MzYgNDQuMzc4NyAzMC4zMDMzIDQzLjc5MjkgMzAuODg5MUwzNC4xNjExIDQwLjUyMDhDMzMuOTY1OSA0MC43MTYxIDMzLjY0OTMgNDAuNzE2MSAzMy40NTQgNDAuNTIwOEwyOC43Njc4IDM1LjgzNDZDMjguMTgyIDM1LjI0ODggMjguMTgyIDM0LjI5OTEgMjguNzY3OCAzMy43MTMzQzI5LjM1MzYgMzMuMTI3NSAzMC4zMDMzIDMzLjEyNzUgMzAuODg5MSAzMy43MTMzTDMzLjQ1NCAzNi4yNzgyWiIgc3Ryb2tlPSJibGFjayIvPgo8L3N2Zz4K'
  };

  // TRANSFERENCIA usa o mesmo ícone de SAIU_ENTREGA (caminhão)
  ICONE.TRANSFERENCIA = ICONE.SAIU_ENTREGA;
  ICONE.OUTRO         = ICONE.POSTADO;

  // ---- Utilitários ----

  function getCodigoFromURL() {
    var p = new URLSearchParams(window.location.search);
    var q = p.get('codigo');
    if (q) return q.trim().toUpperCase();
    var m = window.location.pathname.match(/\/rastreio\/([A-Z]{2}\d{9}[A-Z]{2})(?:\/|$)/i);
    return m ? m[1].toUpperCase() : null;
  }

  function formatarCodigo(c) {
    return c.replace(/^([A-Z]{2})(\d{3})(\d{3})(\d{3})([A-Z]{2})$/, '$1 $2 $3 $4 $5') || c;
  }

  function esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---- Renderização da timeline ----

  function criarStep(ev, isLast) {
    var li = document.createElement('li');
    li.className = 'step';

    var arrowClass = isLast ? 'arrow-none' : 'arrow-current';
    var iconSrc    = ICONE[ev.tipo] || ICONE.OUTRO;

    var detalheHtml = '';
    if (ev.detalheUrl) {
      detalheHtml =
        '<p class="text text-head">' +
          '<a href="' + esc(ev.detalheUrl) + '" target=_blank>' +
            '<u>' + esc(ev.detalhe) + '</u>' +
          '</a>' +
        '</p>';
    } else if (ev.detalhe) {
      detalheHtml = '<p class="text text-head">' + esc(ev.detalhe) + '</p>';
    }

    li.innerHTML =
      '<div class="' + arrowClass + '" bis_skin_checked=1>' +
        '<div class=circle bis_skin_checked=1>' +
          '<img class=circle-img src="' + iconSrc + '"> ' +
        '</div>' +
      '</div>' +
      ' ' +
      '<div class=step-content bis_skin_checked=1>' +
        '<p class="text text-head">' + esc(ev.descricao) + '</p>' +
        '<p class="text text-content">' + esc(ev.local) + '</p>' +
        detalheHtml +
        '<p class="text text-content">' + esc(ev.dataHora) + '</p>' +
      '</div>';

    return li;
  }

  function renderizarTimeline(eventos) {
    var ul = document.getElementById('ship-steps');
    if (!ul) return;
    ul.innerHTML = '';
    eventos.forEach(function (ev, idx) {
      ul.appendChild(criarStep(ev, idx === eventos.length - 1));
    });
  }

  // ---- Preenchimento do template ----

  function preencherTemplate(dados) {
    var elBreadcrumb = document.getElementById('rastreio-breadcrumb');
    var elCodigo     = document.getElementById('rastreio-codigo');
    var elServico    = document.getElementById('rastreio-servico');
    var elShare      = document.querySelector('.share-bar a[data-objeto]');

    if (elBreadcrumb) elBreadcrumb.textContent = dados.codigo;
    if (elCodigo)     elCodigo.textContent      = formatarCodigo(dados.codigo);
    if (elServico)    elServico.textContent      = dados.servico;
    if (elShare)      elShare.setAttribute('data-objeto', dados.codigo);

    document.title = 'Rastreamento de Objetos - ' + dados.codigo;

    renderizarTimeline(dados.eventos);
  }

  // ---- Override do formulário de busca ----

  function configurarFormulario() {
    var form  = document.querySelector('form[data-gtm-form-interact-id]');
    var input = document.getElementById('objeto');
    if (!form || !input) return;

    function navegar(e) {
      if (e && e.preventDefault) e.preventDefault();
      var val = input.value.trim().toUpperCase();
      if (val) window.location.href = '/rastreio.html?codigo=' + encodeURIComponent(val);
    }

    form.addEventListener('submit', navegar);

    // Botão de busca (ícone de lupa) sem type=submit no HTML original
    var btnBuscar = form.querySelector('button[type=submit], .botao-principal');
    if (btnBuscar) btnBuscar.addEventListener('click', navegar);

    input.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') navegar(e);
    });
  }

  // ---- Inicialização ----

  function init() {
    var codigo = getCodigoFromURL();

    configurarFormulario();

    if (!codigo) return;

    fetch('/api/rastreio/' + encodeURIComponent(codigo))
      .then(function (r) {
        if (!r.ok) {
          return r.json().then(function (body) {
            throw new Error(body.erro || ('HTTP ' + r.status));
          });
        }
        return r.json();
      })
      .then(preencherTemplate)
      .catch(function (err) {
        console.error('[Rastreamento] ' + err.message);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
