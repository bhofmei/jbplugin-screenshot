#!/bin/bash

## get several files to test if phantomjs cloud is working with a stable JBrowse instance

wget -O 'file1.json' 'https://phantomjscloud.com/api/browser/v2/a-demo-key-with-low-quota-per-ip-address/?request={url:%22https://bhofmei.github.io/bhofmei-jbplugins/?loc=Chr5%3A8219..13732%26tracks=%26highlight=%26screenshot=p20o1r1n1u1b1m111111s000000z1%22,renderType:%22json%22,outputAsJson:true}'

wget -O 'file2.json' 'https://phantomjscloud.com/api/browser/v2/a-demo-key-with-low-quota-per-ip-address/?request={url:"https://bhofmei.github.io/bhofmei-jbplugins/?loc=Chr5%3A8160..14012%26tracks=t1_genes%2Ct5_rnaseq-un%26highlight=%26screenshot=p20o0r0n0u1b1m111111s000000z1~0h600y1v0i0q0d0f0~1y1i-1x1q1v0",renderType:"json",outputAsJson:true}'

wget -O 'file3.json' 'https://phantomjscloud.com/api/browser/v2/a-demo-key-with-low-quota-per-ip-address/?request={url:"https://bhofmei.github.io/bhofmei-jbplugins/?loc=Chr5%3A40318..49663%26tracks=t1_genes%2Ct3_mt-snps%2Ct5_rnaseq-un%2Ct6_rnaseq-snp%2Ct8_xy%2Ct18_xy2%26highlight=%26screenshot=p20o0r0n0u0b1m111111s000000z1~0h600y1v1i0q0d0f0~1h40y1i0q0~2h620y1v0i0q0d1f0~3y2i0q1~4y3x50q1v0~5y1q1v1",renderType:"json",outputAsJson:true}'

wget -O 'file4.json' 'https://phantomjscloud.com/api/browser/v2/a-demo-key-with-low-quota-per-ip-address/?request={url:"https://bhofmei.github.io/bhofmei-jbplugins/?loc=Chr5%3A36717..41535%26tracks=t11_methyl%2Ct15_methyl-ext%2Ct13_motif-dens%2Ct10_smrna%2Ct12_stranded%2Ct17_rnaseq-st%26highlight=%26screenshot=p20o0r0n0u0b1m111011s000000z1~0y1i-1x1q1v0~1h50y1i-1x1q1v0~2h100i0x1q1v0~3h400y1v0i0q0d0f0~4y1q1v0~5h100y1v0i0q0d0f2",renderType:"json",outputAsJson:true}'

wget -O 'file5.json' 'https://phantomjscloud.com/api/browser/v2/a-demo-key-with-low-quota-per-ip-address/?request={url:"https://bhofmei.github.io/bhofmei-jbplugins/?loc=Chr5%3A35976..40835%26tracks=t11_methyl%2Ct13_motif-dens%2Ct10_smrna%2Ct9_dens%2Ct12_stranded%2Ct17_rnaseq-st%2Ct18_xy2%26highlight=%26screenshot=p10o0r0n0u0b1m011111s000000z1~0y1i-1x1q1v1~1h100i0x1q1v1~2h300y1v1i0q0d0f0~3h31q1v1~4y1q1v1~5h500y1v1i0q0d0f0~6y1q1v1",renderType:"json",outputAsJson:true}'
