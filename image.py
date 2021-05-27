import numpy as np
import matplotlib.pyplot as plt

image = np.loadtxt('image', delimiter=',')
plt.imshow(image)
plt.colorbar()
plt.show()
