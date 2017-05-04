ALTER TABLE `customer`
ADD UNIQUE INDEX `UNIQUE_CUSTOMER` (`email` ASC, `clientid` ASC);

ALTER TABLE `product`
ADD UNIQUE INDEX `UNIQUE_PRODUCT` (`id` ASC, `clientid` ASC);
