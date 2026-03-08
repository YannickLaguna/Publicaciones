---
titulo: Movimiento Browniano
fecha: 2026-03-08
resumen: Un fenómeno utilizado en la física para describir como una mota de polen flota por el aire es lo que nos permite modelizar matemáticamente los mercados financieros. A través del Movimiento Browniano Geométrico justificamos el marco de optimización media-varianza.
tags:
  - modelizacion
  - ✔️
published: true
u_modif: 2026-03-08 | 21:52
---
# Introducción
En la Teoría Moderna de Optimización (MPT) de carteras, formalizada por Harry @markowitzPortfolioSelection1952, se modelizan los precios de los activos a través de los retornos (o relación de cambio) entre periodos. Esto permite comparar la evolución de los precios de múltiples activos entre sí, además de centralizar los datos, volviéndolos estacionarios. Además, únicamente es necesaria la media y varianza para calcular una asignación óptima que maximice la relación riesgo-retorno, asumiendo que se puedan observar los parámetros. 

Cabe preguntarnos: ¿De dónde viene esta modelización? ¿Por qué sólo la media y la varianza -los dos primeros momentos estadísticos- y no incluir sesgo o curtosis? Para responder a estas preguntas es necesario revisar cómo se modelizaba la bolsa antes de la MPT, y qué supuestos conducen de forma natural a esta elección.

# Movimiento Browniano
La primera aplicación significativa de las matemáticas a la inversión en activos fue por L. Bachelier, quién observó que los movimientos en la bolsa de París podían ser descritos a través del Movimiento Browniano @jerison430NOTICESAMS. Este fue investigado por el propio Einstein, quién reconoció que el movimiento de partículas en un medio, como una mota de polen en el agua, es el resultado de multitud de <u>interacciones aleatorias</u> entre partículas individuales. Aplicado en los mercados financieros, permite modelizar la evolución en los precios, descrita como el resultado de infinitos cambios minúsculos independientes entre sí.
@MovimientoBrownianoGeometrico2022

 <Grafica src="galton-board-v2" titulo="Tablero de Galton — 300 bolas" altura={560} />

Las interacciones entre múltiples objetos del Movimiento Browniano no pueden ser resueltas modelizando todas las partículas. Es necesario por lo tanto utilizar modelos probabilísticos aplicados a poblaciones estadísticas. Con el objetivo de ofrecer una comprensión completa revisamos dos planteamientos a continuación.

### Proceso de Wiener 
Queda descrito por el proceso de Wiener, un proceso estocástico en tiempo continuo. Un proceso de Wiener queda caracterizado por 4 hechos:
- $W(0)=0$
- $W_t$ es casi seguro continuo.
- $W_t$ tiene incrementos independientes
- $W(t)-W(s)$ $\sim \mathcal{N}(0,(t-s))$ $(\text{para} \ 0 \leq s \leq t)$ 

Se puede discretizar a través un paseo aleatorio, regido por los incrementos $W(t)-W(s)$. La convergencia del paseo aleatorio discreto al proceso continuo está garantizada por el Teorema de Donsker, que garantiza que la suma normalizada de variables aleatorias independientes e idénticamente distribuidas converge en distribución al proceso de Wiener.
### Caracterización de Lévy
Una alternativa es la caracterización de Lévy. Esta indica que es casi seguro que el proceso de Wiener esté en una martingala continua con $W_0=0$, y variación cuadrada $[W_{t},W_{t}]=t$. Una martingala es un proceso estocástico con esperanza constante. Si nos encontrásemos en un mercado eficiente sin oportunidades de arbitraje, este sigue una martingala.

Si un proceso estocástico sigue una martingala, queda descrito por el espacio de probabilidad:
 $$(C[0,\infty],\sigma-algebra,\mu)$$
- siendo $\mu$ la medida de Wiener, un proceso estocástico continuo que asigna probabilidades coherentes con incrementos gaussianos independientes $\sim N(0,t)$.
## De precios a retornos
En la práctica no se trabaja directamente con niveles de precio si no con la relación de cambio entre periodos, los retornos. Esta elección permite estacionalizar los precios y comparar entre distintos activos, además de aplicar métodos estadísticos. Estos periodos pueden ser discretos, dando retornos simples, o continuos, dando lugar a log-retornos.
### Retornos simples

$$R_{t}=\frac{P_t-P_{t-1}}{P_{t-1}}=\frac{P_t}{P_{t-1}}-1$$

El factor $(1+R_t)={P_t}/{P_{t-1}}$ representa el ratio de precios entre periodos, lo que permite expresar la composición temporal de forma multiplicativa:

$$\frac{P_T}{P_0} = \prod_{t=1}^{T}(1 + R_t)$$

Su principal ventaja es la aditividad cross-sectional, dado un vector asignaciones de capital $w_i$ el retorno total $(R)$ de la cartera es simplemente $R = \sum_{i=1}^N R_i w_i$, lo que permite comparar carteras.
<Grafica src="retornos apple" titulo="Retornos APPL" altura={400} />
### Log-retornos:

$$r_t=\ln \left(\frac{P_t}{P_{t-1}}\right)=\ln(1+R_t) \Rightarrow P_t= P_{t-1}e^{r_{t}}$$

Su ventaja fundamental es la aditividad temporal: el log-retorno acumulado entre 0 y T es la suma de los log-retornos de cada periodo:
$$r_{0\to T} = \ln\frac{P_T}{P_0} = \sum_{t=1}^T r_t$$
Esta relación queda más clara en la siguiente figura, la tendencia pasa a ser una constante!

<Grafica src="precio-vs-log-precio" titulo="Linealización tendencia" altura={400} />

Esto los hace ideales para la modelización y estimación estadística, la aditividad temporal facilita el ajuste de estimadores y regresores. Además el logaritmo relaciona dinámicas aditivas con multiplicativas y normaliza los datos (estabiliza la varianza) manteniendo la estructura del proceso. Para el lector interesado en este tipo de transformaciones se recomienda explorar la familia de transformaciones de Box-Cox.

<Grafica src="log-retornos apple" titulo="Log-retornos APPL" altura={400} />

Ambas formulaciones producen distribuciones muy similares, y aunque presentan colas anchas, se asemejan bastante más a una normal. La normalidad de los log-retornos se deriva a partir del Teorema Central del Límite, por el cuál la suma de distintas variables aleatorias independientes entre sí e identicamente distribuidas converge a una distribución normal. 

El uso de retornos y log-retornos dependerá de qué propiedad de estos se necesite: se utilizarán los retornos normales para construir y comparar carteras, y  los log-retornos para la modelización y estimación estadística.
## Modelización
La fórmula más sencilla para representar el movimiento browniano aplicado a precios es la siguiente ecuación diferencial estocástica y su solución:

$$dP_t = \mu dt + \sigma dW_t \quad \Longleftrightarrow \quad P_t = P_0 + \mu t + \sigma W_t$$
Los precios evolucionan a partir de una tasa de crecimiento determinista, $\mu$ —la deriva o drift— y un proceso estocástico de ruido gaussiano escalado por $\sigma$, la volatilidad.

Esta formulación no es adecuada para modelizar la evolución de los precios por dos motivos. En primer lugar, la distribución normal es simétrica, y por lo tanto puede generar tanto valores negativos como positivos, sin embargo nunca encontraremos acciones con valor negativo. En segundo lugar tampoco captura la dinámica multiplicativa entre periodos: los precios varían de manera porcentual, no aditiva, una caída de 10 puntos no tiene el mismo significado si el precio es 20 que 200. 
# Movimiento Browniano Geométrico
Ambos problemas se resuelven haciendo que los incrementos sean proporcionales al precio actual, dando lugar a la siguiente EDE:
$$dP_t = \mu P_t \, dt + \sigma P_t \, dW_t$$
donde:
- $P_t > 0$ es el precio del activo en el instante $t$.
- $\mu \in \mathbb{R}$ es la deriva o drift, representa la tasa instantánea de crecimiento esperado de los precios.
- $\sigma > 0$ es la volatilidad, medida como la desviación típica de los log-precios instantáneos.
- $\sigma P_t\, dW_t$ es la componente estocástica de difusión, que introduce heterocedasticidad: las fluctuaciones crecen con el precio esto se alinea más con lo que observamos en la realidad.

Para resolver esta ecuación se aplica el [[Lema de Ito]] a $f(P_{t})=ln(P_{t})$, que actúa como regla de la cadena para semimartingalas continuas, siempre que $f(P,t)$ $f \in C^{1,2}(\mathbb{R}_{+}\times\mathbb{R})$. Se obtiene la dinámica de los log-precios:
$$d(\ln P_t) = \left(\mu - \tfrac{1}{2}\sigma^2\right)dt + \sigma\, dW_t$$
Los log-retornos instantáneos siguen un Movimiento Browniano estándar con drift ajustado $(\mu - \tfrac12\sigma^2)$ y volatilidad constante $\sigma$. 

Integando ambos lados se obtiene la solución cerrada:

$$P_t = P_0 \exp \Big((\mu - \tfrac12\sigma^2)t + \sigma W_t\Big)$$
Esta expresión muestra que $P_t$ es siempre positivo. Puesto que $W_t \sim \mathcal{N}(0,t)$, la solución del GBM implica que los log-retornos en un intervalo $\Delta t$ se distribuyen:

$$\ln\left(\frac{P_{t+\Delta t}}{P_t}\right) \sim \mathcal{N}\left(\left(\mu - \frac{\sigma^2}{2}\right)\Delta t,\, \sigma^2 \Delta t\right)$$

y por tanto, $P_t$ sigue una distribución log-normal. A través del logaritmo obtenemos una relación de equivalencia, el GBM sobre los precios es equivalente al MB normal sobre los log-precios.

# Consecuencias e implicaciones teóricas.
A partir del Movimiento Browniano Geométrico podemos obtener las siguientes conclusiones sobre los precios de un activo:
- **Incrementos independientes**: El pasado no contiene información sobre el futuro. Es decir que es imposible predecir sistemáticamente los movimientos del mercado, lo que conecta con la Hipótesis de Mercado Eficiente.
- **Normalidad de los log-retornos**: La distribución normal queda completamente descrita por la media y la varianza. Este es el argumento principal para el marco media-varianza de Markowitz, no es necesario analizar momentos superiores.
- **Escalado temporal de la volatilidad:** $\sigma \sqrt{(t)}$ 
- **Propiedad Markoviana:** Indica que la evolución de los retornos entre intervalos de tiempo no solapados son independientes entre sí: el pasado no afecta al futuro, únicamente el estado presente del sistema. El proceso queda completamente descrito por la media y varianza

# De la teoría a la práctica
En el mundo real las variables no son completamente independientes: distintos eventos de mercado pueden estar correlacionados entre sí, sobre todo eventos extremos, lo que lleva a las colas pesadas que se observan en las distribuciones muestrales. Sin embargo, el supuesto de normalidad sobre la distribución de los log-retornos es muy práctico ya que habilita el uso de la media y la varianza para caracterizar por completo la distribución de los datos. Esto permite hacer un estudio financiero más riguroso, habilitando el marco de optimización de portafolios moderno que utiliza instituciones financieras día a día.

Tampoco es posible saber qué harán los precios en el futuro, es necesario estimarlos, lo que rompe los principios de optimalidad del marco MPT, el enfoque por lo tanto está en minimizar el error de estimación y acercarnos a una predicción robusta.
## Simulación del BM
Para generar simulaciones de movimiento browniano, podemos discretizar el proceso continuo mediante un paseo aleatorio bajo la propiedad markoviana. Dado un intervalo de tiempo $\Delta t$, la discretización de la EDE es:

$$P_{t+\Delta t} = P_t \exp\!\left[\left(\mu - \tfrac{1}{2}\sigma^2\right)\Delta t + \sigma\sqrt{\Delta t}\;\varepsilon_t\right], \quad \varepsilon_t \sim \mathcal{N}(0,1)$$

Este esquema representa una simulación de Monte Carlo, un método por el que simulamos N paseos aleatorios regidos por una distribución normal, para estudiar el abanico de posibles trayectorias que pueden tomar los precios bajo estas dinámicas:

<Grafica src="gbm-trayectorias" titulo="Simulación Monte Carlo del GBM" altura={400} />

La conexión entre el paseo aleatorio discreto y el proceso continuo está garantizada por el Teorema de Donsker, mencionado anteriormente.

Otra alternativa de simulación no paramétrica es utilizar la distribución muestral para generar N muestras aleatorias. Este método se conoce como Bootstrap.

<Grafica src="bootstrap-vs-gbm" titulo="Distribución empírica - GBM - Bootstrap" altura={400} />

## Conexión con MPT
Las hipótesis realizadas sobre el comportamiento del mercado —incrementos independientes, distribución log-normal de precios, escalado $\sigma\sqrt{t}$​— conducen al movimiento browniano como proceso teórico generador de la dinámica de precios. Dado que la distribución de los log-retornos queda completamente caracterizada por la media y la varianza, los modelos de optimización basados en esto heredan esta estructura. Por esto se aplica el marco media-varianza de Markowitz, que le mereció el Nobel en 1990.

## Conexión con asset pricing y Black-Scholes
Modelos posteriores de valoración de activos, como el CAPM, o el modelo de Black-Scholes, utilizan el GBM como proceso generador de dinámicas en los retornos. 

# Referencias